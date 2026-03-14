package cfp

import (
	"time"

	"github.com/marcopollivier/techagenda/lib/model"
)

type Cfp struct {
	model.Model
	EventID   int64     `json:"event_id,string" ts_type:"string"`
	BeginDate time.Time `json:"begin"`
	EndDate   time.Time `json:"end"`
	Href      string    `json:"href"`
}
