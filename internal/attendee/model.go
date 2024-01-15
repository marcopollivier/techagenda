package attendee

import (
	"gorm.io/gorm"

	"github.com/marcopollivier/techagenda/internal/event"
	"github.com/marcopollivier/techagenda/internal/user"
)

type Attendee struct {
	gorm.Model
	FullName    string
	ContactInfo string
	Metadata    any
	EventID     string
	UserID      string

	event.Event
	user.User
}
