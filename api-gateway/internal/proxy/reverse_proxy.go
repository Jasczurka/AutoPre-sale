package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"api-gateway/internal/registry"
	"go.uber.org/zap"
)

// Helper function to get all header keys
func getHeaderKeys(h http.Header) []string {
	keys := make([]string, 0, len(h))
	for k := range h {
		keys = append(keys, k)
	}
	return keys
}

type ReverseProxy struct {
	consul         *registry.ConsulRegistry
	logger         *zap.Logger
	serviceMapping map[string]string
}

func NewReverseProxy(consul *registry.ConsulRegistry, logger *zap.Logger, serviceMapping map[string]string) *ReverseProxy {
	return &ReverseProxy{
		consul:         consul,
		logger:         logger,
		serviceMapping: serviceMapping,
	}
}

// mapServiceName maps path segment to actual Consul service name
func (rp *ReverseProxy) mapServiceName(pathSegment string) string {
	if mappedName, ok := rp.serviceMapping[pathSegment]; ok {
		rp.logger.Debug("Mapped service name",
			zap.String("path_segment", pathSegment),
			zap.String("service_name", mappedName),
		)
		return mappedName
	}
	// If no mapping found, return original (for backward compatibility)
	return pathSegment
}

func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Сохраняем исходный путь для логирования ДО любых изменений
	originalPath := r.URL.Path

	// Логируем входящий запрос
	rp.logger.Info("Received request in reverse proxy",
		zap.String("method", r.Method),
		zap.String("original_path", originalPath),
		zap.String("raw_query", r.URL.RawQuery),
		zap.String("accept_header", r.Header.Get("Accept")),
		zap.String("host", r.Host),
		zap.String("remote_addr", r.RemoteAddr),
	)

	// Извлекаем имя сервиса из пути
	// Формат: /api/service-name/...
	if !strings.HasPrefix(r.URL.Path, "/api/") {
		http.Error(w, "Invalid API path format", http.StatusBadRequest)
		return
	}

	// Убираем /api/ и разбиваем на части
	pathWithoutPrefix := strings.TrimPrefix(r.URL.Path, "/api/")
	pathParts := strings.Split(pathWithoutPrefix, "/")

	rp.logger.Info("Parsed path parts",
		zap.Strings("path_parts", pathParts),
	)

	if len(pathParts) == 0 || pathParts[0] == "" {
		http.Error(w, "Service name not found in path", http.StatusBadRequest)
		return
	}

	pathSegment := pathParts[0]

	// Map path segment to actual service name
	serviceName := rp.mapServiceName(pathSegment)

	// Получаем адрес сервиса из Consul
	rp.logger.Info("Looking up service in Consul",
		zap.String("service_name", serviceName),
		zap.String("path_segment", pathSegment),
	)

	serviceAddr, err := rp.consul.GetServiceAddress(serviceName)
	if err != nil {
		rp.logger.Error("Failed to get service address",
			zap.String("service", serviceName),
			zap.String("original_path", originalPath),
			zap.Error(err),
		)
		http.Error(w, fmt.Sprintf("Service %s not available", serviceName), http.StatusServiceUnavailable)
		return
	}

	rp.logger.Info("Service address resolved",
		zap.String("service", serviceName),
		zap.String("address", serviceAddr),
	)

	// Создаем URL для проксирования
	targetURL, err := url.Parse(fmt.Sprintf("http://%s", serviceAddr))
	if err != nil {
		rp.logger.Error("Failed to parse target URL",
			zap.String("address", serviceAddr),
			zap.Error(err),
		)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Проверяем, является ли это SSE endpoint
	acceptHeader := r.Header.Get("Accept")
	isSSE := acceptHeader == "text/event-stream" || strings.HasSuffix(r.URL.Path, "/events")

	rp.logger.Info("Checking if SSE endpoint",
		zap.String("path", r.URL.Path),
		zap.String("accept_header", acceptHeader),
		zap.Bool("is_sse", isSSE))

	// Создаем reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	// Для SSE endpoints создаем специальный Transport без таймаутов
	if isSSE {
		proxy.Transport = &http.Transport{
			DisableKeepAlives:     false,
			DisableCompression:    true,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			ResponseHeaderTimeout: 0, // Без таймаута для SSE
		}
		proxy.FlushInterval = -1 // -1 означает немедленную передачу каждого write
		rp.logger.Info("SSE endpoint detected, enabling immediate flush",
			zap.String("path", r.URL.Path),
			zap.Duration("flush_interval", proxy.FlushInterval),
			zap.String("target_url", targetURL.String()),
			zap.String("full_url", fmt.Sprintf("http://%s%s", serviceAddr, r.URL.Path)),
		)
	}

	// Обработка ошибок проксирования
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		rp.logger.Error("Proxy error",
			zap.String("path", r.URL.Path),
			zap.String("target", targetURL.String()),
			zap.Error(err),
			zap.Bool("is_sse", isSSE),
		)
		http.Error(w, fmt.Sprintf("Proxy error: %v", err), http.StatusBadGateway)
	}

	// Модифицируем ответ: удаляем CORS заголовки из backend и добавляем свои
	proxy.ModifyResponse = func(resp *http.Response) error {
		rp.logger.Info("Modifying proxy response",
			zap.String("path", r.URL.Path),
			zap.Int("status_code", resp.StatusCode),
			zap.String("content_type", resp.Header.Get("Content-Type")),
			zap.Bool("is_sse", isSSE))

		// Удаляем CORS заголовки из backend сервисов
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		resp.Header.Del("Access-Control-Expose-Headers")
		resp.Header.Del("Access-Control-Max-Age")

		// Добавляем CORS заголовки в ответ
		origin := r.Header.Get("Origin")
		if origin != "" {
			resp.Header.Set("Access-Control-Allow-Origin", origin)
			resp.Header.Set("Access-Control-Allow-Credentials", "true")
		} else {
			resp.Header.Set("Access-Control-Allow-Origin", "*")
		}
		resp.Header.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		resp.Header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")

		// Для SSE устанавливаем правильные заголовки
		if isSSE {
			rp.logger.Info("Setting SSE headers in response",
				zap.Int("status_code", resp.StatusCode),
				zap.String("original_content_type", resp.Header.Get("Content-Type")),
				zap.Strings("all_headers", getHeaderKeys(resp.Header)),
			)

			// Устанавливаем SSE заголовки
			resp.Header.Set("Content-Type", "text/event-stream; charset=utf-8")
			resp.Header.Set("Cache-Control", "no-cache, no-transform")
			resp.Header.Set("Connection", "keep-alive")
			resp.Header.Set("X-Accel-Buffering", "no")

			// Добавляем SSE-специфичные CORS заголовки
			resp.Header.Set("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Connection")

			// Удаляем заголовки, которые могут помешать SSE
			resp.Header.Del("Content-Length")
			resp.Header.Del("Transfer-Encoding")

			rp.logger.Info("SSE headers set successfully",
				zap.String("content_type", resp.Header.Get("Content-Type")),
				zap.String("cache_control", resp.Header.Get("Cache-Control")),
				zap.String("connection", resp.Header.Get("Connection")),
				zap.String("access_control_allow_origin", resp.Header.Get("Access-Control-Allow-Origin")),
			)
		} else {
			resp.Header.Set("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length")
		}

		return nil
	}

	// Модифицируем запрос: убираем имя сервиса из пути, если оно там есть
	// Два формата поддерживаются:
	// 1. Новый: /api/Auth/login → остается как есть
	// 2. Старый: /api/auth-service/Auth/login → убираем auth-service → /api/Auth/login

	// Если первый сегмент это полное имя сервиса (содержит "-service" или совпадает с serviceName),
	// то убираем его из пути
	if pathSegment == serviceName || strings.HasSuffix(pathSegment, "-service") {
		// Убираем имя сервиса из пути
		if len(pathParts) > 1 {
			r.URL.Path = "/api/" + strings.Join(pathParts[1:], "/")
		} else {
			r.URL.Path = "/api"
		}
	}
	// Иначе путь остается как есть (/api/Auth/login)

	rp.logger.Info("Proxying request",
		zap.String("service", serviceName),
		zap.String("original_path", originalPath),
		zap.String("modified_path", r.URL.Path),
		zap.String("target", targetURL.String()),
		zap.String("full_target_url", fmt.Sprintf("%s%s", targetURL.String(), r.URL.Path)),
		zap.Bool("is_sse", isSSE),
	)

	// Для SSE запросов не логируем завершение (соединение остается открытым)
	if isSSE {
		rp.logger.Info("Starting SSE proxy (connection will remain open)",
			zap.String("service", serviceName),
			zap.String("path", r.URL.Path),
		)
	}

	proxy.ServeHTTP(w, r)

	if isSSE {
		rp.logger.Info("SSE connection closed",
			zap.String("service", serviceName),
			zap.String("path", r.URL.Path),
		)
	} else {
		rp.logger.Info("Request proxied successfully",
			zap.String("service", serviceName),
			zap.String("path", r.URL.Path),
		)
	}
}
