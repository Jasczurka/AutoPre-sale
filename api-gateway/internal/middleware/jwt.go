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

			// Пропускаем SSE endpoints (EventSource не поддерживает custom headers)
			if strings.Contains(r.URL.Path, "/events") {
				logger.Info("JWT middleware: Skipping auth for SSE endpoint",
					zap.String("path", r.URL.Path),
					zap.String("method", r.Method),
					zap.String("accept", r.Header.Get("Accept")),
				)
				next.ServeHTTP(w, r)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// Добавляем CORS заголовки перед ошибкой
				origin := r.Header.Get("Origin")
				if origin != "" {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				}
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"error":"Authorization header required"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				// Добавляем CORS заголовки перед ошибкой
				origin := r.Header.Get("Origin")
				if origin != "" {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				}
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"error":"Invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			token := parts[1]

			// Проверяем токен через Auth Service
			if err := validateToken(consul, cfg, token, logger); err != nil {
				logger.Warn("Token validation failed",
					zap.String("path", r.URL.Path),
					zap.Error(err),
				)
				// Добавляем CORS заголовки перед ошибкой
				origin := r.Header.Get("Origin")
				if origin != "" {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				}
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
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
