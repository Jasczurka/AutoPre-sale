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
	// Извлекаем имя сервиса из пути
	// Формат: /api/service-name/...
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/"), "/")
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
	if serviceName == "auth-service" {
		newPath := "/api/Auth/" + strings.Join(pathParts[1:], "/")
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
		zap.String("original_path", r.URL.Path),
		zap.String("target", targetURL.String()),
	)

	proxy.ServeHTTP(w, r)
}