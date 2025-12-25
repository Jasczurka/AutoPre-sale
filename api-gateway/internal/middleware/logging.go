package middleware

import (
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap"
)

func Logging(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			isSSE := strings.Contains(r.URL.Path, "/events")

			// Log incoming request with more details
			logger.Info("Incoming request",
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("remote_addr", r.RemoteAddr),
				zap.String("user_agent", r.Header.Get("User-Agent")),
				zap.String("accept", r.Header.Get("Accept")),
				zap.String("origin", r.Header.Get("Origin")),
				zap.Bool("is_sse", isSSE),
			)

			// Обертка для ResponseWriter для захвата статуса
			wrapped := &responseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			next.ServeHTTP(wrapped, r)

			duration := time.Since(start)

			// For SSE connections, log differently (they stay open)
			if isSSE {
				logger.Info("SSE connection established",
					zap.String("method", r.Method),
					zap.String("path", r.URL.Path),
					zap.String("remote_addr", r.RemoteAddr),
					zap.Int("status", wrapped.statusCode),
					zap.Duration("duration", duration),
				)
			} else {
				logger.Info("HTTP request completed",
					zap.String("method", r.Method),
					zap.String("path", r.URL.Path),
					zap.String("remote_addr", r.RemoteAddr),
					zap.Int("status", wrapped.statusCode),
					zap.Duration("duration", duration),
				)
			}
		})
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
