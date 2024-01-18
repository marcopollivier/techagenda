package config

type Providers struct {
	Github Provider `envPrefix:"GITHUB_"`
}

type Provider struct {
	Key    string `env:"KEY,unset"`
	Secret string `env:"SECRET,unset"`
}
