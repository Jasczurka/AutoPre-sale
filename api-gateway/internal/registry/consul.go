package registry

import (
	"fmt"
	"time"

	"github.com/Jasczurka/AutoPre-sale/api-gateway/internal/config"
	"github.com/hashicorp/consul/api"
)

type ConsulRegistry struct {
	client *api.Client
	cfg    *config.Config
}

func NewConsulRegistry(cfg *config.Config) (*ConsulRegistry, error) {
	consulCfg := api.DefaultConfig()
	if cfg.Consul.Address != "" {
		consulCfg.Address = cfg.Consul.Address
	}
	client, err := api.NewClient(consulCfg)
	if err != nil {
		return nil, err
	}
	return &ConsulRegistry{client: client, cfg: cfg}, nil
}

// Returns first healthy service instance address "http://ip:port"
func (r *ConsulRegistry) GetServiceAddress(serviceName string) (string, error) {
	entries, _, err := r.client.Health().Service(serviceName, "", true, &api.QueryOptions{
		AllowStale:        false,
		RequireConsistent: true,
	})
	if err != nil {
		return "", err
	}
	if len(entries) == 0 {
		return "", fmt.Errorf("service %s not found", serviceName)
	}
	s := entries[0].Service
	host := s.Address
	if host == "" {
		host = s.Service // fallback
	}
	return fmt.Sprintf("http://%s:%d", host, s.Port), nil
}

// Optionally: register the gateway itself (not required)
func (r *ConsulRegistry) RegisterService(name, id, addr string, port int) error {
	reg := &api.AgentServiceRegistration{
		ID:      id,
		Name:    name,
		Address: addr,
		Port:    port,
		Check: &api.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://%s:%d/health", addr, port),
			Interval: "10s",
			Timeout:  "1s",
		},
	}
	return r.client.Agent().ServiceRegister(reg)
}

// Simple helper: wait until consul is ready (optionally used in startup)
func (r *ConsulRegistry) WaitReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for {
		_, err := r.client.Status().Leader()
		if err == nil {
			return nil
		}
		if time.Now().After(deadline) {
			return err
		}
		time.Sleep(200 * time.Millisecond)
	}
}
