package venue

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	GetAllCities(ctx context.Context) (t []string, err error)
	GetAll(ctx context.Context) (venues []Venue, err error)
	GetByID(ctx context.Context, id uint) (venue Venue, err error)
	Create(ctx context.Context, venue Venue) (result Venue, err error)
	Update(ctx context.Context, id uint, venue Venue) (result Venue, err error)
	Delete(ctx context.Context, id uint) (err error)
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
		slog.ErrorContext(ctx, "Fail to get cities from the database", "error", err.Error())
	}
	return
}

func (s *VenueService) GetAll(ctx context.Context) (venues []Venue, err error) {
	if err = s.db.WithContext(ctx).Find(&venues).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get venues from the database", "error", err.Error())
	}
	return
}

func (s *VenueService) GetByID(ctx context.Context, id uint) (venue Venue, err error) {
	if err = s.db.WithContext(ctx).First(&venue, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get venue by id", "id", id, "error", err.Error())
	}
	return
}

func (s *VenueService) Create(ctx context.Context, venue Venue) (result Venue, err error) {
	result = venue
	if err = s.db.WithContext(ctx).Create(&result).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to create venue", "error", err.Error())
	}
	return
}

func (s *VenueService) Update(ctx context.Context, id uint, venue Venue) (result Venue, err error) {
	if err = s.db.WithContext(ctx).First(&result, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to find venue for update", "id", id, "error", err.Error())
		return
	}
	result.Alias = venue.Alias
	result.Address = venue.Address
	result.City = venue.City
	result.Lat = venue.Lat
	result.Long = venue.Long
	if err = s.db.WithContext(ctx).Save(&result).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to update venue", "id", id, "error", err.Error())
	}
	return
}

func (s *VenueService) Delete(ctx context.Context, id uint) (err error) {
	if err = s.db.WithContext(ctx).Delete(&Venue{}, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to delete venue", "id", id, "error", err.Error())
	}
	return
}
