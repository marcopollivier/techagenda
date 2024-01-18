package config

type Config struct {
	AppHost     string    `env:"HOST" envDefault:"http://localhost:8000"`
	HTTPPort    int       `env:"PORT" envDefault:"8000"`
	Environment string    `env:"ENVIRONMENT" envDefault:"unknown"`
	LogLevel    string    `env:"LOG_LEVEL" envDefault:"debug"`
	LogFormat   string    `env:"LOG_FORMAT" envDefault:"text"`
	DB          Database  `envPrefix:"DB_"`
	Providers   Providers `envPrefix:"PROVIDER_"`
}
