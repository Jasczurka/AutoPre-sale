package config

import (
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type RouteConfig struct {
	PathPrefix   string `yaml:"path_prefix"`
	ServiceName  string `yaml:"service_name"`
	AuthRequired bool   `yaml:"auth_required"`
}

type ServerConfig struct {
	Port                   int    `yaml:"port"`
	ShutdownTimeoutSeconds int    `yaml:"shutdown_timeout_seconds"`
	JWTSecret              string `yaml:"jwt_secret"`
}

type ConsulConfig struct {
	Address        string `yaml:"address"`
	TimeoutSeconds int    `yaml:"timeout_seconds"`
}

type Config struct {
	Server ServerConfig  `yaml:"server"`
	Consul ConsulConfig  `yaml:"consul"`
	Routes []RouteConfig `yaml:"routes"`
}

func LoadConfig(path string) (*Config, error) {
	cfg := &Config{}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}
	// sane defaults
	if cfg.Server.ShutdownTimeoutSeconds == 0 {
		cfg.Server.ShutdownTimeoutSeconds = 10
	}
	if cfg.Consul.TimeoutSeconds == 0 {
		cfg.Consul.TimeoutSeconds = 3
	}
	return cfg, nil
}

func (c *Config) ConsulTimeout() time.Duration {
	return time.Duration(c.Consul.TimeoutSeconds) * time.Second
}
