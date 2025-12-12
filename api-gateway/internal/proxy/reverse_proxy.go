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
	consul *registry.ConsulRegistry
	logger *zap.Logger
}

func NewReverseProxy(consul *registry.ConsulRegistry, logger *zap.Logger) *ReverseProxy {
	return &ReverseProxy{
		consul: consul,
		logger: logger,
	}
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

	serviceName := pathParts[0]
	
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
	
	// Модифицируем запрос: убираем /api/service-name из пути
	// Для auth-service сохраняем /api/Auth в пути, так как контроллер использует [Route("api/[controller]")]
	// Для project-service сохраняем /api/Projects в пути, так как контроллер использует [Route("api/[controller]")]
	// Для backlog-service сохраняем /api/Backlog в пути, так как контроллер использует [Route("api/[controller]")]
	var newPath string
	if len(pathParts) > 1 {
		// pathParts[0] = service-name, pathParts[1:] = [controller, action, ...]
		// Нужно получить /api/controller/action/...
		newPath = "/api/" + strings.Join(pathParts[1:], "/")
	} else {
		// Если после service-name ничего нет, оставляем /api
		newPath = "/api"
	}
	
	r.URL.Path = newPath

	rp.logger.Info("Proxying request",
		zap.String("service", serviceName),
		zap.String("original_path", originalPath),
		zap.String("modified_path", r.URL.Path),
		zap.String("target", targetURL.String()),
	)

	proxy.ServeHTTP(w, r)
}