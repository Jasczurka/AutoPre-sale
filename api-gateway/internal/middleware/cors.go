package middleware

import (
	"net/http"

	"go.uber.org/zap"
)

func CORS(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Обрабатываем только preflight запросы (OPTIONS)
			// Все остальные CORS заголовки будут добавлены в reverse proxy ModifyResponse
			if r.Method == "OPTIONS" {
				origin := r.Header.Get("Origin")
				if origin != "" {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				}
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
				w.Header().Set("Access-Control-Max-Age", "3600")

				logger.Debug("CORS: Handling OPTIONS preflight request",
					zap.String("path", r.URL.Path),
					zap.String("origin", origin),
				)

				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
