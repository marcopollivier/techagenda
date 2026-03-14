package config

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
	"github.com/samber/lo"
	"go.uber.org/atomic"
)

var (
	version       string // HACK: This variable is filled at compiling time though a build argument `-ldflags "-X config.version=$VERSION"`
	defaultConfig atomic.Value
	configErr     error
)

func init() {
	env := os.Getenv("ENV")
	envPath := "./.env"
	if lo.IsNotEmpty(env) {
		envPath = "./.env." + env
	}
	slog.Info(fmt.Sprintf("Loading config from %s", envPath))
	err := godotenv.Load(envPath)
	if err != nil {
		slog.Error("fail to load config", slog.Any("err", err))
	}

	// Once .env is loaded, start config parsing
	cfg, err := load()
	if err != nil {
		configErr = err
		slog.Warn("Config not fully loaded (expected for key-gen)", "error", err)
		return
	}
	defaultConfig.Store(cfg)
}

func Version() string { return lo.Ternary(lo.IsNotEmpty(version), version, "0.0.0-unknown") }

func Get() Config {
	v := defaultConfig.Load()
	if v == nil {
		panic("config not loaded: " + configErr.Error())
	}
	return lo.FromPtr(v.(*Config))
}

func load() (*Config, error) {
	cfg := Config{}
	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
