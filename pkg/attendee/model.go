package attendee

import (
	"github.com/marcopollivier/techagenda/lib/model"
	"github.com/marcopollivier/techagenda/pkg/user"
)

type Attendee struct {
	model.Model
	FullName    string
	ContactInfo string
	Metadata    any   `gorm:"serializer:json"`
	EventID     int64 `json:"EventID,string" ts_type:"string"`
	UserID      int64 `json:"UserID,string" ts_type:"string"`

	User user.User
}
