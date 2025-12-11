package middleware

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"api-gateway/internal/config"
	"api-gateway/internal/registry"

	"go.uber.org/zap"
)

func NewJWT(consul *registry.ConsulRegistry, cfg config.JWTConfig, logger *zap.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Пропускаем health check и публичные эндпоинты
			if r.URL.Path == "/health" || r.URL.Path == "/" {
				next.ServeHTTP(w, r)
				return
			}

			// Пропускаем эндпоинты авторизации
			if strings.HasPrefix(r.URL.Path, "/api/auth-service/") {
				next.ServeHTTP(w, r)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"Authorization header required"}`, http.StatusUnauthorized)
				w.Header().Set("Content-Type", "application/json")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, `{"error":"Invalid authorization header format"}`, http.StatusUnauthorized)
				w.Header().Set("Content-Type", "application/json")
				return
			}

			token := parts[1]

			// Проверяем токен через Auth Service
			if err := validateToken(consul, cfg, token, logger); err != nil {
				logger.Warn("Token validation failed",
					zap.String("path", r.URL.Path),
					zap.Error(err),
				)
				http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
				w.Header().Set("Content-Type", "application/json")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func validateToken(consul *registry.ConsulRegistry, cfg config.JWTConfig, token string, logger *zap.Logger) error {
	// Получаем адрес Auth Service из Consul
	authServiceAddr, err := consul.GetServiceAddress(cfg.AuthService)
	if err != nil {
		return fmt.Errorf("failed to get auth service address: %w", err)
	}

	// Используем /api/Auth/me для проверки токена
	// Если токен валидный, запрос пройдет успешно
	req, err := http.NewRequest("GET", fmt.Sprintf("http://%s/api/Auth/me", authServiceAddr), nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	client := &http.Client{
		Timeout: 5 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call auth service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("token validation failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}
