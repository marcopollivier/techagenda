package event

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/marcopollivier/techagenda/pkg/cfp"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type Service interface {
	Get(ctx context.Context, name, city string, tags []string, typeOf []EventTypeOf, available bool, page, limit int) (events []Event, err error)
	GetByID(ctx context.Context, id int64) (event Event, err error)
	GetByCreator(ctx context.Context, userID int64) (events []Event, err error)
	GetByUserAttendance(ctx context.Context, userID int64) (events []Event, err error)
	Create(ctx context.Context, user user.User, event EventDTO, tags []string, venueIDs []int64, cfpData *cfp.Cfp) (result Event, err error)
	Update(ctx context.Context, id int64, event EventDTO, tags []string, venueIDs []int64, cfpData *cfp.Cfp) (result Event, err error)
	Delete(ctx context.Context, id int64) (err error)
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
		Joins("LEFT JOIN events_tags ON events_tags.event_id = events.id").
		Joins("LEFT JOIN tags ON tags.id = events_tags.tag_id").
		Joins("LEFT JOIN events_venues ON events_venues.event_id = events.id").
		Joins("LEFT JOIN venues ON venues.id = events_venues.venue_id").
		Preload("Attendees").
		Preload("Attendees.User").
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
		base.Where(fmt.Sprintf("title like '%%%s%%'", name))
	}
	if lo.IsNotEmpty(city) {
		base.Where("venues.city = ?", city)
	}
	if len(tags) > 0 {
		base.Where("tags.tag in ?", tags)
	}
	if len(typeOf) > 0 {
		base.Where(fmt.Sprintf("type_of <@ array[%s]", strings.Join(lo.Map(typeOf, func(i EventTypeOf, _ int) string {
			return fmt.Sprintf("'%s'::eventtypeof", i.String())
		}), ",")))
	}
	if available {
		base.Where("begin_date <= ?", now).Where("end_date > ?", now)
	}

	if err = base.Find(&events).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to scan events", "error", err.Error())
	}
	return
}

func (e *EventService) GetByID(ctx context.Context, id int64) (event Event, err error) {
	if err = e.db.WithContext(ctx).
		Preload("Tags").
		Preload("Venues").
		Preload("Attendees").
		Preload("Attendees.User").
		Preload("Cfp").
		Preload("User").
		First(&event, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get event by id", "id", id, "error", err.Error())
	}
	return
}

func (e *EventService) GetByCreator(ctx context.Context, userID int64) (events []Event, err error) {
	if err = e.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Preload("Tags").
		Preload("Venues").
		Preload("Attendees").
		Preload("Attendees.User").
		Preload("Cfp").
		Preload("User").
		Order("begin_date DESC").
		Find(&events).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get events by creator", "user_id", userID, "error", err.Error())
	}
	return
}

func (e *EventService) GetByUserAttendance(ctx context.Context, userID int64) (events []Event, err error) {
	var eventIDs []int64
	if err = e.db.WithContext(ctx).
		Table("attendees").
		Select("event_id").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Find(&eventIDs).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get attended event ids", "user_id", userID, "error", err.Error())
		return
	}
	if len(eventIDs) == 0 {
		return
	}
	if err = e.db.WithContext(ctx).
		Preload("Tags").
		Preload("Venues").
		Preload("Attendees").
		Order("begin_date DESC").
		Find(&events, eventIDs).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get attended events", "user_id", userID, "error", err.Error())
	}
	return
}

func (e *EventService) Create(ctx context.Context, user user.User, event EventDTO, tags []string, venueIDs []int64, cfpData *cfp.Cfp) (result Event, err error) {
	type EventsTag struct {
		EventID int64
		TagID   int64
	}
	type EventsVenue struct {
		EventID int64
		VenueID int64
	}
	var (
		tagIDs []int64
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

		// Link tags
		if len(tags) > 0 {
			if er = tx.Table("tags").Select("id").Where("tag in ?", tags).Find(&tagIDs).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to find tags", "error", er.Error())
				return er
			}
			if len(tagIDs) != len(tags) {
				slog.ErrorContext(ctx, "Some tags were not found in the database", "tags_requested", tags, "ids_found", tagIDs)
				return errors.New("unable to find a match for all the requested tags")
			}
			for _, tagID := range tagIDs {
				if er = tx.Create(&EventsTag{EventID: result.ID, TagID: tagID}).Error; er != nil {
					slog.ErrorContext(ctx, "Fail to create join of event and tag", "error", er.Error(), "tag_id", tagID)
					return er
				}
			}
		}

		// Link venues
		for _, venueID := range venueIDs {
			if er = tx.Create(&EventsVenue{EventID: result.ID, VenueID: venueID}).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to link venue to event", "error", er.Error(), "venue_id", venueID)
				return er
			}
		}

		// Create CFP
		if cfpData != nil && lo.IsNotEmpty(cfpData.Href) {
			cfpData.EventID = result.ID
			if er = tx.Create(cfpData).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to create CFP", "error", er.Error())
				return er
			}
		}

		return nil
	})

	return
}

func (e *EventService) Update(ctx context.Context, id int64, dto EventDTO, tags []string, venueIDs []int64, cfpData *cfp.Cfp) (result Event, err error) {
	type EventsTag struct {
		EventID int64
		TagID   int64
	}
	type EventsVenue struct {
		EventID int64
		VenueID int64
	}

	var typeOf = lo.Map(dto.TypeOf, func(i EventTypeOf, _ int) string { return i.String() })

	if err = e.db.WithContext(ctx).First(&result, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to find event for update", "id", id, "error", err.Error())
		return
	}

	result.Title = dto.Title
	result.Banner = dto.Banner
	result.Description = dto.Description
	result.Href = dto.Href
	result.TypeOf = append(pq.StringArray{}, typeOf...)
	result.BeginDate = dto.BeginDate
	result.EndDate = dto.EndDate

	err = e.db.Transaction(func(tx *gorm.DB) (er error) {
		if er = tx.Save(&result).Error; er != nil {
			slog.ErrorContext(ctx, "Fail to update event", "id", id, "error", er.Error())
			return er
		}

		// Re-link tags
		if tags != nil {
			if er = tx.Where("event_id = ?", id).Delete(&EventsTag{}).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to clear event tags", "error", er.Error())
				return er
			}
			if len(tags) > 0 {
				var tagIDs []int64
				if er = tx.Table("tags").Select("id").Where("tag in ?", tags).Find(&tagIDs).Error; er != nil {
					return er
				}
				for _, tagID := range tagIDs {
					if er = tx.Create(&EventsTag{EventID: id, TagID: tagID}).Error; er != nil {
						return er
					}
				}
			}
		}

		// Re-link venues
		if venueIDs != nil {
			if er = tx.Where("event_id = ?", id).Delete(&EventsVenue{}).Error; er != nil {
				slog.ErrorContext(ctx, "Fail to clear event venues", "error", er.Error())
				return er
			}
			for _, venueID := range venueIDs {
				if er = tx.Create(&EventsVenue{EventID: id, VenueID: venueID}).Error; er != nil {
					return er
				}
			}
		}

		// Upsert or delete CFP
		if cfpData != nil && lo.IsNotEmpty(cfpData.Href) {
			cfpData.EventID = id
			var existing cfp.Cfp
			if er = tx.Where("event_id = ?", id).First(&existing).Error; er != nil {
				if er == gorm.ErrRecordNotFound {
					er = tx.Create(cfpData).Error
				}
			} else {
				existing.BeginDate = cfpData.BeginDate
				existing.EndDate = cfpData.EndDate
				existing.Href = cfpData.Href
				er = tx.Save(&existing).Error
			}
			if er != nil {
				return er
			}
		} else {
			// Remove CFP if no data provided
			tx.Where("event_id = ?", id).Delete(&cfp.Cfp{})
		}

		return nil
	})

	return
}

func (e *EventService) Delete(ctx context.Context, id int64) (err error) {
	if err = e.db.WithContext(ctx).Delete(&Event{}, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to delete event", "id", id, "error", err.Error())
	}
	return
}
