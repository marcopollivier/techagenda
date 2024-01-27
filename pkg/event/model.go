package event

import (
	"time"

	"github.com/lib/pq"
	"github.com/marcopollivier/techagenda/pkg/attendee"
	"github.com/marcopollivier/techagenda/pkg/user"
	"gorm.io/gorm"
)

//go:generate go-enum --marshal --sql -f model.go

type Event struct {
	gorm.Model
	Title       string              `json:"title"`
	Banner      string              `json:"banner"`
	Description string              `json:"description"`
	Href        string              `json:"href"`
	TypeOf      pq.StringArray      `json:"type_of" gorm:"type:text[]"`
	BeginDate   time.Time           `json:"begin"`
	EndDate     time.Time           `json:"end"`
	CfpID       uint                `json:"cfp_id"`
	UserID      uint                `json:"user_id"`
	Attendees   []attendee.Attendee `json:"attendees"`

	Tags   []Tags    `json:"tags" gorm:"many2many:events_tags"`
	Venues []Venue   `json:"venues" gorm:"many2many:events_venues"`
	Cfp    Cfp       `json:"cfp"`
	User   user.User `json:"user"`
}

// func (Event) TableName() string { return "events" }

type Venue struct {
	gorm.Model
	Alias   string `json:"alias"`
	Address string `json:"address"`
	City    string `json:"city"`
	Lat     string `json:"lat"`
	Long    string `json:"long"`
}

type Cfp struct {
	gorm.Model
	BeginDate time.Time `json:"begin"`
	EndDate   time.Time `json:"end"`
	Href      string    `json:"href"`
}

type Tags struct {
	gorm.Model
	Tag string `json:"tag"`
}

// ENUM(online, in_person)
type EventTypeOf int
