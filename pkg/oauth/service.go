package oauth

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/markbates/goth"
	"gorm.io/gorm"
)

type Service interface {
	Auth(ctx context.Context, oauthUser goth.User) (user user.User, err error)
}

type OAuthService struct {
	db          *gorm.DB
	userService user.Service
}

func NewOAuthService(db *gorm.DB, userService user.Service) Service {
	return &OAuthService{
		db:          db,
		userService: userService,
	}
}

func (s *OAuthService) Auth(ctx context.Context, oauthUser goth.User) (authUser user.User, err error) {
	var (
		oauth    OAuth
		provider Provider
	)

	if err = s.db.WithContext(ctx).
		Where("provider = ?", oauthUser.Provider).
		Where("identifier = ?", oauthUser.UserID).
		First(&oauth).Error; err != nil && err != gorm.ErrRecordNotFound {
		slog.ErrorContext(ctx, "Unexpected error searching for oauth link", "provider", oauthUser.Provider, "error", err.Error())
		return authUser, err
	}

	// If the provider and id does not match to any one already on the database, we need to link with an user if the email already exists, if not we need to create a new user and link it.
	if err == gorm.ErrRecordNotFound {
		slog.WarnContext(ctx, fmt.Sprintf("We didn't found a oauth link for email %s and provider %s", oauthUser.Email, oauthUser.Provider))
		if authUser, err = s.userService.GetByEmail(ctx, oauthUser.Email); err != nil {
			if err != gorm.ErrRecordNotFound {
				slog.ErrorContext(ctx, "Unexpected error searching for user", "error", err.Error())
				return authUser, err
			}

			slog.WarnContext(ctx, "No user found to this oauth link, creating a new one")
			authUser = user.User{
				Email:  oauthUser.Email,
				Name:   oauthUser.Name,
				Avatar: oauthUser.AvatarURL,
				Bio:    oauthUser.Description,
			}
			if authUser, err = s.userService.Create(ctx, authUser); err != nil {
				return authUser, err
			}
		}

		if provider, err = ParseProvider(oauthUser.Provider); err != nil {
			slog.ErrorContext(ctx, fmt.Sprintf("Unexpected provider %s", oauthUser.Provider), "error", err.Error())
			return authUser, err
		}

		slog.InfoContext(ctx, fmt.Sprintf("Linking user %d to oauth provider %s of identifier %s", authUser.ID, oauthUser.Provider, oauthUser.UserID))
		oauth = OAuth{
			UserID:     authUser.ID,
			Provider:   provider,
			Identifier: oauthUser.UserID,
		}
		if err = s.db.WithContext(ctx).Create(&oauth).Error; err != nil {
			slog.ErrorContext(ctx, "Fail to create link of oauth user", "user", authUser.ID, "error", err.Error())
			return authUser, err
		}
		return authUser, err
	}

	// If oauth is linked with a user just return the user
	if authUser, err = s.userService.Get(ctx, oauth.UserID); err != nil {
		return
	}

	go func() {
		if authUser.Avatar != oauthUser.AvatarURL {
			if _, err := s.userService.UpdateAvatar(context.Background(), authUser.ID, oauthUser.AvatarURL); err != nil {
				slog.Error("Unable to update users avatar", "user_id", authUser.ID, "error", err.Error())
			}
		}
	}()
	return
}
