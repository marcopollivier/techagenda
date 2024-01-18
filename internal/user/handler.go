package user

import (
	"log/slog"

	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	service Service
}

func NewUserHandler(service Service) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) ListAll(c echo.Context) (err error) {
	var (
		ctx     = c.Request().Context()
		roleSTR = c.QueryParam("role")
		role    Role
		users   []User
	)

	if role, err = ParseRole(roleSTR); err != nil {
		slog.ErrorContext(ctx, err.Error())
		return err
	}

	if users, err = h.service.ListAll(ctx, role); err != nil {
		slog.ErrorContext(ctx, err.Error())
		return err
	}

	return c.JSON(200, users)
}
