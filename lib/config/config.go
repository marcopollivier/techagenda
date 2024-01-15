package config

type Config struct {
	HTTPPort    int       `env:"HTTP_PORT" envDefault:"8000"`
	Environment string    `env:"ENVIRONMENT" envDefault:"unknown"`
	LogLevel    string    `env:"LOG_LEVEL" envDefault:"debug"`
	LogFormat   string    `env:"LOG_FORMAT" envDefault:"text"`
	DB          Database  `envPrefix:"DB_"`
	Providers   Providers `envPrefix:"PROVIDER_"`
}
