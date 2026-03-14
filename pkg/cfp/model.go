package cfp

import (
	"time"

	"gorm.io/gorm"
)

type Cfp struct {
	gorm.Model
	EventID   uint      `json:"event_id"`
	BeginDate time.Time `json:"begin"`
	EndDate   time.Time `json:"end"`
	Href      string    `json:"href"`
}
