package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server         ServerConfig      `yaml:"server"`
	Consul         ConsulConfig      `yaml:"consul"`
	Logging        LoggingConfig     `yaml:"logging"`
	JWT            JWTConfig         `yaml:"jwt"`
	ServiceMapping map[string]string `yaml:"service_mapping"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
	Host string `yaml:"host"`
}

type ConsulConfig struct {
	Address    string `yaml:"address"`
	Datacenter string `yaml:"datacenter"`
}

type LoggingConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

type JWTConfig struct {
	Secret      string `yaml:"secret"`
	AuthService string `yaml:"auth_service"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	// Override with environment variables if present
	if addr := os.Getenv("CONSUL_ADDRESS"); addr != "" {
		config.Consul.Address = addr
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		config.JWT.Secret = secret
	}
	if authService := os.Getenv("AUTH_SERVICE"); authService != "" {
		config.JWT.AuthService = authService
	}

	return &config, nil
}
