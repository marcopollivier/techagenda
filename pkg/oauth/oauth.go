package oauth

import (
	"github.com/marcopollivier/techagenda/lib/model"
)

//go:generate go-enum --marshal --sql -f oauth.go

type OAuth struct {
	model.Model
	UserID     int64
	Provider   Provider
	Identifier string
}

func (OAuth) TableName() string { return "oauths" }

// ENUM(github)
type Provider int
