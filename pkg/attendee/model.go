package attendee

import (
	"gorm.io/gorm"

	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/user"
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
