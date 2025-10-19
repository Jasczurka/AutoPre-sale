package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/config"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/registry"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/router"
)

type App struct {
	cfg *config.Config
	reg *registry.ConsulRegistry
	srv *http.Server
}

func NewApp(cfg *config.Config) (*App, error) {
	reg, err := registry.NewConsulRegistry(cfg)
	if err != nil {
		return nil, err
	}
	// wait until consul ready (optional)
	_ = reg.WaitReady(cfg.ConsulTimeout())

	mux, err := router.NewMux(cfg, reg)
	if err != nil {
		return nil, err
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.Port),
		Handler: mux,
	}

	return &App{cfg: cfg, reg: reg, srv: srv}, nil
}

func (a *App) Run(ctx context.Context) error {
	log.Printf("starting API Gateway on %s", a.srv.Addr)
	// run server
	errChan := make(chan error, 1)
	go func() {
		if err := a.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- err
		}
		close(errChan)
	}()

	// wait for context cancel or server error
	select {
	case <-ctx.Done():
		return a.Shutdown(context.Background())
	case err := <-errChan:
		return err
	}
}

func (a *App) Shutdown(ctx context.Context) error {
	ctx2, cancel := context.WithTimeout(ctx, time.Duration(a.cfg.Server.ShutdownTimeoutSeconds)*time.Second)
	defer cancel()
	log.Println("shutting down HTTP server...")
	if err := a.srv.Shutdown(ctx2); err != nil {
		return err
	}
	log.Println("HTTP server stopped")
	return nil
}
