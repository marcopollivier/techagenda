package tag

import "github.com/marcopollivier/techagenda/lib/model"

type Tag struct {
	model.Model
	Tag string `json:"tag"`
}
