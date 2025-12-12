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
	// Логируем исходный путь для отладки
	originalPath := r.URL.Path
	rp.logger.Info("Received request",
		zap.String("original_path", originalPath),
	)
	
	// Извлекаем имя сервиса из пути
	// Формат: /api/service-name/...
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/"), "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		http.Error(w, "Service name not found in path", http.StatusBadRequest)
		return
	}

	serviceName := pathParts[0]
	rp.logger.Info("Parsed path",
		zap.String("service", serviceName),
		zap.Strings("path_parts", pathParts),
	)
	
	// Получаем адрес сервиса из Consul
	serviceAddr, err := rp.consul.GetServiceAddress(serviceName)
	if err != nil {
		rp.logger.Error("Failed to get service address",
			zap.String("service", serviceName),
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
	if serviceName == "auth-service" {
		// pathParts[0] = "auth-service", pathParts[1:] = ["Auth", "register", ...]
		// Нужно получить /api/Auth/register
		newPath := "/api/" + strings.Join(pathParts[1:], "/")
		r.URL.Path = newPath
	} else if serviceName == "project-service" {
		// pathParts[0] = "project-service", pathParts[1:] = ["Projects", ...]
		// Нужно получить /api/Projects/...
		newPath := "/api/" + strings.Join(pathParts[1:], "/")
		r.URL.Path = newPath
	} else if serviceName == "backlog-service" {
		// pathParts[0] = "backlog-service", pathParts[1:] = ["Backlog", ...]
		// Нужно получить /api/Backlog/...
		newPath := "/api/" + strings.Join(pathParts[1:], "/")
		r.URL.Path = newPath
	} else {
		newPath := "/" + strings.Join(pathParts[1:], "/")
		if newPath == "/" {
			newPath = ""
		}
		r.URL.Path = newPath
	}

	rp.logger.Info("Proxying request",
		zap.String("service", serviceName),
		zap.String("modified_path", r.URL.Path),
		zap.String("target", targetURL.String()),
	)

	proxy.ServeHTTP(w, r)
}