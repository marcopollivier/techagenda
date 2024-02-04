package event

import (
	"time"

	"github.com/lib/pq"
	"github.com/marcopollivier/techagenda/pkg/attendee"
	"github.com/marcopollivier/techagenda/pkg/cfp"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/marcopollivier/techagenda/pkg/venue"
	"gorm.io/gorm"
)

//go:generate go-enum --marshal --sql -f model.go

type Event struct {
	gorm.Model
	Title       string         `json:"title"`
	Banner      string         `json:"banner"`
	Description string         `json:"description"`
	Href        string         `json:"href"`
	TypeOf      pq.StringArray `json:"type_of" gorm:"type:text[]"`
	BeginDate   time.Time      `json:"begin"`
	EndDate     time.Time      `json:"end"`
	UserID      uint           `json:"user_id"`

	Attendees []attendee.Attendee `json:"attendees"`
	Tags      []tag.Tag           `json:"tags" gorm:"many2many:events_tags"`
	Venues    []venue.Venue       `json:"venues" gorm:"many2many:events_venues"`
	Cfp       cfp.Cfp             `json:"cfp"`
	User      user.User           `json:"user"`
}

// ENUM(online, in_person)
type EventTypeOf int

type EventDTO struct {
	Title       string        `json:"title"`
	Banner      string        `json:"banner"`
	Description string        `json:"description"`
	Href        string        `json:"href"`
	TypeOf      []EventTypeOf `json:"type_of"`
	BeginDate   time.Time     `json:"begin"`
	EndDate     time.Time     `json:"end"`
}
