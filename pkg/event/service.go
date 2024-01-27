package event

import (
	"context"
	"log/slog"
	"time"

	"github.com/samber/lo"
	"gorm.io/gorm"
)

type Service interface {
	Get(ctx context.Context, name, city string, tags []string, typeOf []EventTypeOf, available bool, page, limit int) (events []Event, err error)
}

type EventService struct {
	db *gorm.DB
}

func NewEventService(db *gorm.DB) Service {
	return &EventService{
		db: db,
	}
}

func (e *EventService) Get(
	ctx context.Context,
	name, city string,
	tags []string,
	typeOf []EventTypeOf,
	available bool,
	page, limit int,
) (events []Event, err error) {
	if limit == 0 || limit > 100 {
		limit = 50
	}
	now := time.Now()
	base := e.db.Joins("User").
		Preload("Attendees").Preload("Tags").Preload("Venues").
		Offset(page * limit).
		Limit(limit)

	if lo.IsNotEmpty(name) {
		base.Where("name like ?", name)
	}
	if lo.IsNotEmpty(city) {
		base.Where("venues.city in ?", city)
	}
	if len(tags) > 0 {
		base.Where("tags.tag in ?", tags)
	}
	if len(typeOf) > 0 {
		base.Where("? in ANY(typeOf)", typeOf)
	}
	if available {
		base.Where("begin_date <= ?", now).Where("end_date > ?", now)
	}

	if err = base.Find(&events).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to scan events", "error", err.Error())
	}
	return
}
