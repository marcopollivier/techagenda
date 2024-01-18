package config

import (
	"github.com/caarlos0/env/v10"
	"github.com/samber/lo"
	"go.uber.org/atomic"
)

var (
	version       string // HACK: This variable is filled at compiling time though a build argument `-ldflags "-X config.version=$VERSION"`
	defaultConfig atomic.Value
)

func init() {
	defaultConfig.Store(load())
}

func Version() string { return lo.Ternary(lo.IsNotEmpty(version), version, "0.0.0-unknown") }

func Get() Config { return lo.FromPtr(defaultConfig.Load().(*Config)) }

func load() *Config {
	cfg := Config{}
	if err := env.Parse(&cfg); err != nil {
		panic(err)
	}
	return &cfg
}
