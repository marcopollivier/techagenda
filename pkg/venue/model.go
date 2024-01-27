package venue

import "gorm.io/gorm"

type Venue struct {
	gorm.Model
	Alias   string `json:"alias"`
	Address string `json:"address"`
	City    string `json:"city"`
	Lat     string `json:"lat"`
	Long    string `json:"long"`
}
