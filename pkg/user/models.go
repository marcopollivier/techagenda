package user

import "gorm.io/gorm"

//go:generate go-enum --marshal --sql -f models.go

type User struct {
	gorm.Model
	Email string
	Name  string
	Role  Role
}

func (u *User) IsAdmin() bool { return u.Role == RoleAdmin }
func (u *User) IsMod() bool   { return u.Role == RoleMod }

type OAuth struct {
	gorm.Model
	UserID     uint
	Provider   Provider
	Identifier string

	User User
}

func (OAuth) TableName() string { return "oauths" }

// ENUM(user, mod, admin)
type Role int

// ENUM(github)
type Provider int
