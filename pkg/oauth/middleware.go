package oauth

import (
	"context"
	"log/slog"

	"github.com/labstack/echo/v4"
	"github.com/marcopollivier/techagenda/lib/session"
	"github.com/marcopollivier/techagenda/pkg/user"
)

type MiddlewareCtxKey string

const (
	MiddlewareUserKey MiddlewareCtxKey = "user"
)

func AuthMiddleware(service Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (err error) {
			var (
				ctx         = c.Request().Context()
				user        user.User
				req         = c.Request()
				res         = c.Response()
				userSession session.UserSession
			)
			if userSession, err = CheckCurrentSession(res, req); err != nil {
				return next(c)
			}
			if user, err = service.Auth(ctx, userSession.AuthUser); err != nil {
				slog.ErrorContext(ctx, "Fail to get user information from database", "error", err.Error())
				return next(c)
			}
			ctx = context.WithValue(ctx, MiddlewareUserKey, user)
			c.SetRequest(c.Request().WithContext(ctx))
			return next(c)
		}
	}
}

func GetUserFromCtx(ctx context.Context) *user.User {
	var userPtr *user.User
	if userData, ok := ctx.Value(MiddlewareUserKey).(user.User); ok {
		userPtr = &userData
	}
	return userPtr
}
