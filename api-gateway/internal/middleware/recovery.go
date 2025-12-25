package middleware

import (
	"net/http"
	"strings"

	"go.uber.org/zap"
)

func Recovery(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					// Игнорируем "abort Handler" panic - это нормально для SSE и long-lived соединений
					if err == http.ErrAbortHandler {
						logger.Debug("Handler aborted (normal for SSE)",
							zap.String("path", r.URL.Path),
							zap.String("method", r.Method),
						)
						panic(err) // Re-panic, чтобы соединение корректно закрылось
					}

					// Для обычных паник логируем как ошибку
					logger.Error("Panic recovered",
						zap.Any("error", err),
						zap.String("path", r.URL.Path),
						zap.String("method", r.Method),
						zap.String("remote_addr", r.RemoteAddr),
						zap.Bool("is_sse", strings.Contains(r.URL.Path, "/events")),
					)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
