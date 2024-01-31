package venue

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	GetAllCities(ctx context.Context) (t []string, err error)
}

type VenueService struct {
	db *gorm.DB
}

func NewVenueService(db *gorm.DB) Service {
	return &VenueService{
		db: db,
	}
}

func (s *VenueService) GetAllCities(ctx context.Context) (t []string, err error) {
	if err = s.db.WithContext(ctx).Table("venues").Select("distinct city").Scan(&t).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get tags from the database", "error", err.Error())
	}
	return
}
