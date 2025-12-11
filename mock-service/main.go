package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	consulapi "github.com/hashicorp/consul/api"
)

type MockService struct {
	port     string
	consul   *consulapi.Client
	serviceID string
}

func NewMockService(port string) (*MockService, error) {
	config := consulapi.DefaultConfig()
	config.Address = os.Getenv("CONSUL_ADDRESS")
	if config.Address == "" {
		config.Address = "consul:8500"
	}

	client, err := consulapi.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Consul client: %w", err)
	}

	return &MockService{
		port:     port,
		consul:   client,
		serviceID: fmt.Sprintf("mock-service-%s", port),
	}, nil
}

func (ms *MockService) Register() error {
	registration := &consulapi.AgentServiceRegistration{
		ID:      ms.serviceID,
		Name:    "mock-service",
		Address: "mock-service",
		Port:    8081,
		Check: &consulapi.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://mock-service:%s/health", ms.port),
			Interval: "10s",
			Timeout:  "3s",
		},
	}

	return ms.consul.Agent().ServiceRegister(registration)
}

func (ms *MockService) Deregister() error {
	return ms.consul.Agent().ServiceDeregister(ms.serviceID)
}

func (ms *MockService) Start() error {
	http.HandleFunc("/health", ms.healthHandler)
	http.HandleFunc("/", ms.rootHandler)
	http.HandleFunc("/test", ms.testHandler)

	addr := fmt.Sprintf(":%s", ms.port)
	log.Printf("Mock service starting on %s", addr)
	return http.ListenAndServe(addr, nil)
}

func (ms *MockService) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"service": "mock-service",
	})
}

func (ms *MockService) rootHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Mock Service",
		"method":  r.Method,
		"path":    r.URL.Path,
		"time":    time.Now().Format(time.RFC3339),
	})
}

func (ms *MockService) testHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Test endpoint",
		"status":  "success",
		"data": map[string]interface{}{
			"id":   1,
			"name": "Test Item",
		},
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	service, err := NewMockService(port)
	if err != nil {
		log.Fatalf("Failed to create service: %v", err)
	}

	// Регистрируем сервис в Consul
	if err := service.Register(); err != nil {
		log.Printf("Warning: Failed to register in Consul: %v", err)
	} else {
		log.Println("Registered in Consul")
	}

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down...")
		service.Deregister()
		os.Exit(0)
	}()

	if err := service.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

