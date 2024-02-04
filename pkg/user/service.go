package user

import (
	"context"
	"fmt"
	"log/slog"

	"gorm.io/gorm"
)

type Service interface {
	Create(ctx context.Context, u User) (user User, err error)
	Get(ctx context.Context, userID uint) (user User, err error)
	GetByEmail(ctx context.Context, email string) (user User, err error)
	ListAll(ctx context.Context, role Role) (users []User, err error)
	UpdateAvatar(ctx context.Context, userID uint, newAvatarHref string) (user User, err error)
}

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) Service {
	return &UserService{
		db: db,
	}
}

func (s *UserService) Create(ctx context.Context, u User) (user User, err error) {
	if err = s.db.WithContext(ctx).Create(&u).Error; err != nil {
		slog.ErrorContext(ctx, "Fail to create new user", "error", err.Error(), "user", u)
		return u, err
	}
	return u, err
}

func (s *UserService) Get(ctx context.Context, userID uint) (user User, err error) {
	if err = s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		slog.ErrorContext(ctx, "Unable to find user!", "user", userID, "error", err.Error())
	}
	return user, err
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (user User, err error) {
	if err = s.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		slog.ErrorContext(ctx, "Unable to find user!", "email", email, "error", err.Error())
	}
	return user, err
}

func (s *UserService) ListAll(ctx context.Context, role Role) (users []User, err error) {
	if err = s.db.WithContext(ctx).Model(new(User)).Where("role = ?", role.String()).Scan(&users).Error; err != nil {
		slog.ErrorContext(ctx, fmt.Sprintf("Fail to list users of role %s", role), "error", err.Error())
	}
	return users, err
}

func (s *UserService) UpdateAvatar(ctx context.Context, userID uint, newAvatarHref string) (user User, err error) {
	if err = s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		slog.ErrorContext(ctx, "Unable to find user!", "user", userID, "error", err.Error())
	}
	user.Avatar = newAvatarHref
	if errI := s.db.WithContext(ctx).Where("id = ?", user.ID).Updates(&user).Error; errI != nil {
		slog.ErrorContext(ctx, "Unable to update users avatar!", "user", user.ID, "error", errI.Error())
	}
	return user, err
}
