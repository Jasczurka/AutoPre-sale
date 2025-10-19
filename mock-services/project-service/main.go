package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hashicorp/consul/api"
)

func main() {
	port := 9001
	serviceName := "project-service"
	host, _ := os.Hostname()

	// регистрация в Consul
	consulCfg := api.DefaultConfig()
	consulCfg.Address = "http://consul:8500"
	client, err := api.NewClient(consulCfg)
	if err != nil {
		log.Fatalf("consul error: %v", err)
	}

	reg := &api.AgentServiceRegistration{
		ID:      fmt.Sprintf("%s-%s", serviceName, host),
		Name:    serviceName,
		Address: "project-service",
		Port:    port,
		Check: &api.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://project-service:%d/health", port),
			Interval: "5s",
			Timeout:  "2s",
		},
	}

	err = client.Agent().ServiceRegister(reg)
	if err != nil {
		log.Fatalf("register error: %v", err)
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	http.HandleFunc("/projects", func(w http.ResponseWriter, _ *http.Request) {
		resp := map[string]string{"service": serviceName, "message": "Hello from Project Service!"}
		_ = json.NewEncoder(w).Encode(resp)
	})

	log.Printf("Project service running on :%d", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}
