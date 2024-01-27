package attendee

import (
	"gorm.io/gorm"

	"github.com/marcopollivier/techagenda/pkg/user"
)

type Attendee struct {
	gorm.Model
	FullName    string
	ContactInfo string
	Metadata    any `gorm:"serializer:json"`
	EventID     uint
	UserID      uint

	User user.User
}
