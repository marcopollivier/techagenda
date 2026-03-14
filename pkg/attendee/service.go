package attendee

import (
	"context"
	"errors"
	"log/slog"

	"gorm.io/gorm"
)

var ErrPreviouslyCancelled = errors.New("attendee previously cancelled")

type Service interface {
	Add(ctx context.Context, eventID, userID uint, fullName string) error
	Remove(ctx context.Context, eventID, userID uint) error
	Reactivate(ctx context.Context, eventID, userID uint) error
	GetCancelledByEvent(ctx context.Context, eventID uint) ([]Attendee, error)
}

type AttendeeService struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) Service {
	return &AttendeeService{db: db}
}

func (s *AttendeeService) Add(ctx context.Context, eventID, userID uint, fullName string) error {
	// Check active record first (GORM filters deleted_at IS NULL by default)
	var existing Attendee
	err := s.db.WithContext(ctx).
		Where("event_id = ? AND user_id = ?", eventID, userID).
		First(&existing).Error
	if err == nil {
		return nil // already attending
	}
	if err != gorm.ErrRecordNotFound {
		slog.ErrorContext(ctx, "Fail to check existing attendee", "error", err.Error())
		return err
	}

	// Check for soft-deleted record (includes deleted_at IS NOT NULL)
	var deleted Attendee
	err = s.db.WithContext(ctx).Unscoped().
		Where("event_id = ? AND user_id = ? AND deleted_at IS NOT NULL", eventID, userID).
		First(&deleted).Error
	if err == nil {
		return ErrPreviouslyCancelled
	}

	attendee := Attendee{
		EventID:  eventID,
		UserID:   userID,
		FullName: fullName,
	}
	if err = s.db.WithContext(ctx).Create(&attendee).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to create attendee", "error", err.Error())
		return err
	}
	return nil
}

func (s *AttendeeService) Remove(ctx context.Context, eventID, userID uint) error {
	if err := s.db.WithContext(ctx).
		Where("event_id = ? AND user_id = ?", eventID, userID).
		Delete(&Attendee{}).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to remove attendee", "error", err.Error())
		return err
	}
	return nil
}

func (s *AttendeeService) GetCancelledByEvent(ctx context.Context, eventID uint) ([]Attendee, error) {
	var attendees []Attendee
	if err := s.db.WithContext(ctx).Unscoped().
		Preload("User").
		Where("event_id = ? AND deleted_at IS NOT NULL", eventID).
		Find(&attendees).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get cancelled attendees", "event_id", eventID, "error", err.Error())
		return nil, err
	}
	return attendees, nil
}

func (s *AttendeeService) Reactivate(ctx context.Context, eventID, userID uint) error {
	result := s.db.WithContext(ctx).Unscoped().
		Model(&Attendee{}).
		Where("event_id = ? AND user_id = ? AND deleted_at IS NOT NULL", eventID, userID).
		Update("deleted_at", nil)
	if result.Error != nil {
		slog.ErrorContext(ctx, "Fail to reactivate attendee", "error", result.Error.Error())
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
