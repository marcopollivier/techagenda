package oauth

import (
	"gorm.io/gorm"
)

//go:generate go-enum --marshal --sql -f oauth.go

type OAuth struct {
	gorm.Model
	UserID     uint
	Provider   Provider
	Identifier string
}

func (OAuth) TableName() string { return "oauths" }

// ENUM(github)
type Provider int
