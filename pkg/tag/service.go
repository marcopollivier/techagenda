package tag

import (
	"context"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	GetAllTags(ctx context.Context) (t []string, err error)
	GetAll(ctx context.Context) (tags []Tag, err error)
	Create(ctx context.Context, name string) (result Tag, err error)
	Delete(ctx context.Context, id uint) (err error)
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

func (s *TagsService) GetAll(ctx context.Context) (tags []Tag, err error) {
	if err = s.db.WithContext(ctx).Find(&tags).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to get tags from the database", "error", err.Error())
	}
	return
}

func (s *TagsService) Create(ctx context.Context, name string) (result Tag, err error) {
	result = Tag{Tag: name}
	if err = s.db.WithContext(ctx).Create(&result).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to create tag", "error", err.Error())
	}
	return
}

func (s *TagsService) Delete(ctx context.Context, id uint) (err error) {
	if err = s.db.WithContext(ctx).Delete(&Tag{}, id).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to delete tag", "id", id, "error", err.Error())
	}
	return
}
