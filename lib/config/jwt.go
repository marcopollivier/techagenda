package config

import (
	"encoding/base64"
)

type JWT struct {
	Private Cert `env:"PRIVATE_KEY,required"`
	Public  Cert `env:"PUBLIC_KEY,required"`
}

type Cert []byte

func (c *Cert) UnmarshalText(text []byte) error {
	out, err := base64.StdEncoding.DecodeString(string(text))
	if err != nil {
		return err
	}
	*c = Cert(out)
	return nil
}
