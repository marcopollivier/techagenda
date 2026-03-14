package user

import "github.com/marcopollivier/techagenda/lib/model"

//go:generate go-enum --marshal --sql -f user.go

type User struct {
	model.Model
	Email  string
	Name   string
	Role   Role
	Bio    string
	Avatar string
}

func (u *User) IsAdmin() bool { return u.Role == RoleAdmin }
func (u *User) IsMod() bool   { return u.Role == RoleMod }

// ENUM(user, mod, admin)
type Role int
