package user

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/markbates/goth"
	"gorm.io/gorm"
)

type Service interface {
	Auth(ctx context.Context, oauthUser goth.User) (user User, err error)
	Get(ctx context.Context, userID uint) (user User, err error)
	ListAll(ctx context.Context, role Role) (users []User, err error)
}

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) Service {
	return &UserService{
		db: db,
	}
}

func (s *UserService) Auth(ctx context.Context, oauthUser goth.User) (user User, err error) {
	var oauth OAuth
	if err = s.db.WithContext(ctx).
		Where("provider = ?", oauthUser.Provider).
		Where("identifier = ?", oauthUser.UserID).
		First(&oauth).Error; err != nil && err != gorm.ErrRecordNotFound {
		slog.ErrorContext(ctx, "Unexpected error searching for oauth link", "provider", oauthUser.Provider, "error", err.Error())
		return user, err
	}

	// If the provider and id does not match to any one already on the database, we need to link with an user if the email already exists, if not we need to create a new user and link it.
	if err == gorm.ErrRecordNotFound {
		var provider Provider
		slog.WarnContext(ctx, fmt.Sprintf("We didn't found a oauth link for email %s and provider %s", oauthUser.Email, oauthUser.Provider))
		if err = s.db.WithContext(ctx).Where("email = ?", oauthUser.Email).First(&user).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				slog.ErrorContext(ctx, "Unexpected error searching for user", "error", err.Error())
				return user, err
			}

			slog.WarnContext(ctx, "No user found to this oauth link, creating a new one")
			user = User{
				Email: oauthUser.Email,
				Name:  oauthUser.Name,
			}
			if err = s.db.WithContext(ctx).Create(&user).Error; err != nil {
				slog.ErrorContext(ctx, "Fail to create new user", "error", err.Error())
				return user, err
			}
		}

		if provider, err = ParseProvider(oauthUser.Provider); err != nil {
			slog.ErrorContext(ctx, fmt.Sprintf("Unexpected provider %s", oauthUser.Provider), "error", err.Error())
			return user, err
		}

		slog.InfoContext(ctx, fmt.Sprintf("Linking user %d to oauth provider %s of identifier %s", user.ID, oauthUser.Provider, oauthUser.UserID))
		oauth = OAuth{
			UserID:     user.ID,
			Provider:   provider,
			Identifier: oauthUser.UserID,
		}
		if err = s.db.WithContext(ctx).Create(&oauth).Error; err != nil {
			slog.ErrorContext(ctx, "Fail to create link of oauth user", "user", user.ID, "error", err.Error())
			return user, err
		}
		return user, err
	}

	// If oauth is linked with a user just return the user
	return s.Get(ctx, oauth.UserID)
}

func (s *UserService) Get(ctx context.Context, userID uint) (user User, err error) {
	if err = s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		slog.ErrorContext(ctx, "Unable to find user!", "user", userID)
	}
	return user, err
}

func (s *UserService) ListAll(ctx context.Context, role Role) (users []User, err error) {
	if err = s.db.WithContext(ctx).Model(new(User)).Where("role = ?", role.String()).Scan(&users).Error; err != nil {
		slog.ErrorContext(ctx, fmt.Sprintf("Fail to list users of role %s", role))
	}
	return users, err
}
