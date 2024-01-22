package config

import (
	"regexp"
	"strconv"
)

type Database struct {
	Host    string `env:"HOST" envDefault:"127.0.0.1"`
	Port    int    `env:"PORT" envDefault:"5432"`
	Name    string `env:"NAME" envDefault:"postgres"`
	User    string `env:"USER" envDefault:"postgres"`
	Pass    string `env:"PASSWORD,unset"`
	SSLMode string `env:"SSL_MODE" envDefault:"disable"`
	URL     string `env:"URL"`
}

var (
	postgresURLRegex = regexp.MustCompile(`postgres:\/\/(\w+):(\w+)@(.*?):(\d{4})\/(\w+)`)
)

func (d Database) ParseURL() Database {
	list := postgresURLRegex.FindStringSubmatch(d.URL)
	if len(list) < 6 {
		return d
	}
	d.User = list[1]
	d.Pass = list[2]
	d.Host = list[3]
	d.Name = list[5]

	if port, err := strconv.Atoi(list[4]); err == nil {
		d.Port = port
	}

	return d
}
