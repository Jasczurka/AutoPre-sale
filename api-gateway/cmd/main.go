package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/app"
	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/config"
)

func main() {
	// load config
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// create app
	application, err := app.NewApp(cfg)
	if err != nil {
		log.Fatalf("failed to init app: %v", err)
	}

	// run server
	serverCtx, serverCancel := context.WithCancel(context.Background())
	defer serverCancel()

	go func() {
		if err := application.Run(serverCtx); err != nil {
			log.Fatalf("server stopped with error: %v", err)
		}
	}()

	// wait signal
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	<-stop
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.Server.ShutdownTimeoutSeconds)*time.Second)
	defer cancel()

	if err := application.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}

	log.Println("graceful shutdown complete")
}
