package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const UserCtxKey ctxKey = "userClaims"

// Middleware factory to capture secret from config
func JWTAuthMiddleware(secret string) func(http.Handler) http.Handler {
	var key = []byte(secret)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, "missing or invalid authorization header", http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				// optionally validate alg here
				return key, nil
			}, jwt.WithLeeway(5*time.Second))
			if err != nil || !token.Valid {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			// store claims in context
			ctx := context.WithValue(r.Context(), UserCtxKey, token.Claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
