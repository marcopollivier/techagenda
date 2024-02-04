package tag

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	GetAllTags(ctx context.Context) (t []string, err error)
}

type TagsService struct {
	db *gorm.DB
}

func NewTagsService(db *gorm.DB) Service {
	return &TagsService{
		db: db,
	}
}

func (s *TagsService) GetAllTags(ctx context.Context) (t []string, err error) {
	if err = s.db.WithContext(ctx).Table("tags").Select("tag").Scan(&t).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get tags from the database", "error", err.Error())
	}
	return
}
