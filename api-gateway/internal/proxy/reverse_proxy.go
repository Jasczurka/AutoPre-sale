package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"api-gateway/internal/registry"
	"go.uber.org/zap"
)

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

	// Создаем reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	// Модифицируем ответ: удаляем CORS заголовки из backend (API Gateway их уже добавил)
	proxy.ModifyResponse = func(resp *http.Response) error {
		// Удаляем CORS заголовки из backend сервисов
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		resp.Header.Del("Access-Control-Expose-Headers")
		resp.Header.Del("Access-Control-Max-Age")
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
	)

	proxy.ServeHTTP(w, r)
}
