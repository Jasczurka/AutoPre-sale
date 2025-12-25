package internal

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"api-gateway/internal/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"api-gateway/internal/registry"
	"api-gateway/internal/router"

	"go.uber.org/zap"
)

type App struct {
	config     *config.Config
	logger     *zap.Logger
	router     *router.Router
	consul     *registry.ConsulRegistry
	httpServer *http.Server
}

func NewApp(configPath string) (*App, error) {
	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	logger, err := initLogger(cfg.Logging)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}

	consul, err := registry.NewConsulRegistry(cfg.Consul)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Consul: %w", err)
	}

	proxyHandler := proxy.NewReverseProxy(consul, logger, cfg.ServiceMapping)
	jwtMiddleware := middleware.NewJWT(consul, cfg.JWT, logger)
	r := router.NewRouter(proxyHandler, logger, jwtMiddleware)

	middlewareChain := middleware.Chain(
		middleware.Recovery(logger),
		middleware.Logging(logger),
		middleware.CORS(logger),
		jwtMiddleware,
	)

	httpRouter := r.SetupRoutes()
	handler := middlewareChain(httpRouter)

	httpServer := &http.Server{
		Addr:        fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:     handler,
		ReadTimeout: 15 * time.Second,
		// WriteTimeout должен быть 0 для SSE (long-lived connections)
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}

	return &App{
		config:     cfg,
		logger:     logger,
		router:     r,
		consul:     consul,
		httpServer: httpServer,
	}, nil
}

func (a *App) Run(ctx context.Context) error {
	a.logger.Info("Starting API Gateway",
		zap.String("address", a.httpServer.Addr),
		zap.String("consul", a.config.Consul.Address),
	)

	errChan := make(chan error, 1)

	go func() {
		if err := a.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- fmt.Errorf("HTTP server error: %w", err)
		}
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		a.logger.Info("Shutting down HTTP server...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := a.httpServer.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("failed to shutdown server: %w", err)
		}

		a.logger.Info("Server stopped gracefully")
		return nil
	}
}

func initLogger(cfg config.LoggingConfig) (*zap.Logger, error) {
	var logger *zap.Logger
	var err error

	if cfg.Format == "json" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}

	if err != nil {
		return nil, err
	}

	return logger, nil
}
