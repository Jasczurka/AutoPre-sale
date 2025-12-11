package registry

import (
	"fmt"

	"api-gateway/internal/config"
	consulapi "github.com/hashicorp/consul/api"
)

type ConsulRegistry struct {
	client *consulapi.Client
}

func NewConsulRegistry(cfg config.ConsulConfig) (*ConsulRegistry, error) {
	config := consulapi.DefaultConfig()
	config.Address = cfg.Address
	config.Datacenter = cfg.Datacenter

	client, err := consulapi.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Consul client: %w", err)
	}

	registry := &ConsulRegistry{
		client: client,
	}

	// Проверяем подключение
	_, err = client.Agent().Self()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Consul: %w", err)
	}

	return registry, nil
}

func (cr *ConsulRegistry) GetServiceAddress(serviceName string) (string, error) {
	services, _, err := cr.client.Health().Service(serviceName, "", true, nil)
	if err != nil {
		return "", fmt.Errorf("failed to query service: %w", err)
	}

	if len(services) == 0 {
		return "", fmt.Errorf("service %s not found", serviceName)
	}

	service := services[0].Service
	address := fmt.Sprintf("%s:%d", service.Address, service.Port)
	return address, nil
}

func (cr *ConsulRegistry) RegisterService(serviceName string, address string, port int) error {
	registration := &consulapi.AgentServiceRegistration{
		ID:      fmt.Sprintf("%s-%d", serviceName, port),
		Name:    serviceName,
		Address: address,
		Port:    port,
		Check: &consulapi.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://%s:%d/health", address, port),
			Interval: "10s",
			Timeout:  "3s",
		},
	}

	return cr.client.Agent().ServiceRegister(registration)
}

func (cr *ConsulRegistry) DeregisterService(serviceID string) error {
	return cr.client.Agent().ServiceDeregister(serviceID)
}

func (cr *ConsulRegistry) ListServices() (map[string]*consulapi.AgentService, error) {
	return cr.client.Agent().Services()
}