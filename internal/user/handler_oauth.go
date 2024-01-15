package user

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
)

func (h *UserHandler) AuthLogin(c echo.Context) (err error) {
	var (
		ctx         = c.Request().Context()
		providerRaw = c.Param("provider")
		authUser    goth.User
		user        User
	)

	if _, err = ParseProvider(providerRaw); err != nil {
		slog.ErrorContext(ctx, err.Error())
		return c.JSON(404, nil)
	}
	ctx = context.WithValue(ctx, "provider", providerRaw)
	c.SetRequest(c.Request().WithContext(ctx))

	if authUser, err = gothic.CompleteUserAuth(c.Response(), c.Request()); err != nil {
		slog.ErrorContext(ctx, "Fail to complete user auth", "error", err.Error())
		gothic.BeginAuthHandler(c.Response(), c.Request())
		return nil
	}
	if user, err = h.service.Auth(ctx, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to get user information from database", "error", err.Error())
		return c.JSON(500, map[string]any{
			"error": err.Error(),
		})
	}

	return c.JSON(200, user)
}

func (h *UserHandler) AuthLogout(c echo.Context) (err error) {
	var (
		ctx         = c.Request().Context()
		res         = c.Response()
		req         = c.Request()
		providerRaw = c.Param("provider")
	)
	if _, err = ParseProvider(providerRaw); err != nil {
		slog.ErrorContext(ctx, err.Error())
		return c.JSON(404, nil)
	}
	ctx = context.WithValue(ctx, "provider", providerRaw)
	c.SetRequest(c.Request().WithContext(ctx))

	gothic.Logout(res, req)
	res.Header().Set("Location", "/")
	res.WriteHeader(http.StatusTemporaryRedirect)
	return
}

func (h *UserHandler) AuthCallback(c echo.Context) (err error) {
	var (
		ctx         = c.Request().Context()
		res         = c.Response()
		req         = c.Request()
		providerRaw = c.Param("provider")
		authUser    goth.User
		user        User
	)
	if _, err = ParseProvider(providerRaw); err != nil {
		slog.ErrorContext(ctx, err.Error())
		return c.JSON(404, nil)
	}
	ctx = context.WithValue(ctx, "provider", providerRaw)
	c.SetRequest(c.Request().WithContext(ctx))

	if authUser, err = gothic.CompleteUserAuth(res, req); err != nil {
		slog.ErrorContext(ctx, "Fail to complete user auth", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if user, err = h.service.Auth(ctx, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to get user information from database", "error", err.Error())
		return c.JSON(500, map[string]any{
			"error": err.Error(),
		})
	}

	return c.JSON(200, user)
}
