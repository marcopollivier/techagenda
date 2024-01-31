package event

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/lib/pq"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type Service interface {
	Get(ctx context.Context, name, city string, tags []string, typeOf []EventTypeOf, available bool, page, limit int) (events []Event, err error)
	Create(ctx context.Context, user user.User, event EventDTO, tags []string) (result Event, err error)
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
	base := e.db.
		Select("events.*, array_agg(tags.tag) as tags, array_agg(venues.*) as venues").
		Group("events.id, events.title, events.banner, events.description, events.href, events.type_of, events.begin_date, events.end_date, events.user_id, events.created_at, events.updated_at, events.deleted_at, \"User\".id").
		Joins("User").
		Joins("JOIN events_tags ON events_tags.event_id = events.id").
		Joins("JOIN tags ON tags.id = events_tags.tag_id").
		Joins("JOIN events_venues ON events_venues.event_id = events.id").
		Joins("JOIN venues ON venues.id = events_venues.venue_id").
		Preload("Attendees").
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			if len(tags) > 0 {
				return db.Where("tag in ?", tags)
			}
			return db
		}).
		Preload("Venues", func(db *gorm.DB) *gorm.DB {
			if lo.IsNotEmpty(city) {
				return db.Where("city = ?", city)
			}
			return db
		}).
		Offset(page * limit).
		Limit(limit)

	if lo.IsNotEmpty(name) {
		base.Where("name like ?", name)
	}
	if lo.IsNotEmpty(city) {
		base.Where("venues.city = ?", city)
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

func (e *EventService) Create(ctx context.Context, user user.User, event EventDTO, tags []string) (result Event, err error) {
	type EventsTag struct {
		EventID uint
		TagID   uint
	}
	var (
		tagIDs []uint
		typeOf = lo.Map(event.TypeOf, func(i EventTypeOf, _ int) string { return i.String() })
	)

	result = Event{
		Title:       event.Title,
		Banner:      event.Banner,
		Description: event.Description,
		Href:        event.Href,
		TypeOf:      append(pq.StringArray{}, typeOf...),
		BeginDate:   event.BeginDate,
		EndDate:     event.EndDate,
		UserID:      user.ID,
	}

	err = e.db.Transaction(func(tx *gorm.DB) (er error) {
		if er = tx.Create(&result).Error; er != nil {
			slog.ErrorContext(ctx, "Fail to create event", "error", er.Error())
			return er
		}
		if er = tx.Table("tags").Select("id").Where("tag in = ?", tags).Find(&tagIDs).Error; er != nil {
			slog.ErrorContext(ctx, "Fail to find tags", "error", er.Error())
			return er
		}
		if len(tagIDs) != len(tags) {
			slog.ErrorContext(ctx, "Some tags ware not found in the database", "tags_requested", tags, "ids_found", tagIDs)
			return errors.New("unable to find a match for all the requested tags")
		}
		for _, tagID := range tagIDs {
			eventTag := EventsTag{
				EventID: result.ID,
				TagID:   tagID,
			}
			if er = tx.Create(&eventTag).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to create join of event and tag", "error", er.Error(), "event", result, "tag_id", tagID)
				return er
			}
		}

		return nil
	})

	return
}
