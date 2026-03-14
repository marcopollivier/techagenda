package cfp

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	CreateOrUpdate(ctx context.Context, cfp Cfp) (result Cfp, err error)
	DeleteByEventID(ctx context.Context, eventID int64) (err error)
}

type CfpService struct {
	db *gorm.DB
}

func NewCfpService(db *gorm.DB) Service {
	return &CfpService{
		db: db,
	}
}

func (s *CfpService) CreateOrUpdate(ctx context.Context, cfp Cfp) (result Cfp, err error) {
	var existing Cfp
	if err = s.db.WithContext(ctx).Where("event_id = ?", cfp.EventID).First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			result = cfp
			if err = s.db.WithContext(ctx).Create(&result).Error; err != nil {
				slog.ErrorContext(ctx, "Fail to create CFP", "error", err.Error())
			}
			return
		}
		slog.ErrorContext(ctx, "Fail to find CFP", "error", err.Error())
		return
	}
	existing.BeginDate = cfp.BeginDate
	existing.EndDate = cfp.EndDate
	existing.Href = cfp.Href
	if err = s.db.WithContext(ctx).Save(&existing).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to update CFP", "error", err.Error())
	}
	result = existing
	return
}

func (s *CfpService) DeleteByEventID(ctx context.Context, eventID int64) (err error) {
	if err = s.db.WithContext(ctx).Where("event_id = ?", eventID).Delete(&Cfp{}).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to delete CFP", "event_id", eventID, "error", err.Error())
	}
	return
}
