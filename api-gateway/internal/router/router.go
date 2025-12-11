package router

import (
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"net/http"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type Router struct {
	proxy      *proxy.ReverseProxy
	logger     *zap.Logger
	jwtMiddleware middleware.Middleware
}

func NewRouter(proxy *proxy.ReverseProxy, logger *zap.Logger, jwtMiddleware middleware.Middleware) *Router {
	return &Router{
		proxy:     proxy,
		logger:    logger,
		jwtMiddleware: jwtMiddleware,
	}
}

func (r *Router) SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", r.healthCheck).Methods("GET")

	// API routes - все запросы к /api/* проксируются
	router.PathPrefix("/api/").Handler(r.proxy)

	// Default route
	router.HandleFunc("/", r.rootHandler).Methods("GET")

	return router
}

func (r *Router) healthCheck(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","service":"api-gateway"}`))
}

func (r *Router) rootHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"API Gateway","version":"1.0.0"}`))
}