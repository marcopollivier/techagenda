package config

type Database struct {
	Host    string `env:"HOST" envDefault:"127.0.0.1"`
	Port    int    `env:"PORT" envDefault:"5432"`
	Name    string `env:"NAME" envDefault:"postgres"`
	User    string `env:"USER" envDefault:"postgres"`
	Pass    string `env:"PASSWORD,unset"`
	SSLMode string `env:"SSL_MODE" envDefault:"disable"`
	URL     string `env:"URL"`
}
