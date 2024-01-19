package event

import (
	"time"

	"gorm.io/gorm"

	"github.com/marcopollivier/techagenda/pkg/user"
)

type Event struct {
	gorm.Model
	Name         string
	Tags         []string
	Location     string
	ScheduleDate time.Time
	OwnerUserID  uint
	ExternalLink string

	user.User
}
