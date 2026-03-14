package venue

import "github.com/marcopollivier/techagenda/lib/model"

type Venue struct {
	model.Model
	Alias   string `json:"alias"`
	Address string `json:"address"`
	City    string `json:"city"`
	Lat     string `json:"lat"`
	Long    string `json:"long"`
}
