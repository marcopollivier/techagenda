package oauth

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/marcopollivier/techagenda/lib/server"
	"github.com/marcopollivier/techagenda/lib/session"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/samber/lo"
)

type OAuthHandler struct {
	service Service
}

func NewOAuthHandler(service Service) *OAuthHandler {
	return &OAuthHandler{service: service}
}

func (h *OAuthHandler) AuthLogin(c echo.Context) (err error) {
	var (
		ctx      = c.Request().Context()
		res      = c.Response()
		req      = c.Request()
		authUser goth.User
		userData user.User
		token    string
	)

	if _, ok := c.Request().Context().Value(MiddlewareUserKey).(user.User); ok {
		res.Header().Set("Location", getReferer(req))
		res.WriteHeader(http.StatusTemporaryRedirect)
		return
	}
	if authUser, err = gothic.CompleteUserAuth(res, req); err != nil {
		slog.ErrorContext(ctx, "Fail to complete user auth", "error", err.Error())
		gothic.BeginAuthHandler(c.Response(), c.Request())
		return nil
	}
	if userData, err = h.service.Auth(ctx, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to get user information from database", "error", err.Error())
		return c.JSON(500, map[string]any{
			"error": err.Error(),
		})
	}
	if token, err = session.GenerateJWT(userData.ID, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to generate JWT session", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if err = server.StoreInSession(token, req, res); err != nil {
		slog.ErrorContext(ctx, "Fail to save session on session manager", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}

	res.Header().Set("Location", getReferer(req))
	res.WriteHeader(http.StatusTemporaryRedirect)
	return
}

func (h *OAuthHandler) AuthLogout(c echo.Context) (err error) {
	var (
		res = c.Response()
		req = c.Request()
	)
	if err = gothic.Logout(res, req); err != nil {
		slog.Error("Fail to execute oauth logout", "error", err.Error())
		return
	}
	if err = server.Logout(res, req); err != nil {
		slog.Error("Fail to execute session logout", "error", err.Error())
		return
	}
	res.Header().Set("Location", getReferer(req))
	res.WriteHeader(http.StatusTemporaryRedirect)
	return
}

func (h *OAuthHandler) AuthCallback(c echo.Context) (err error) {
	var (
		ctx      = c.Request().Context()
		res      = c.Response()
		req      = c.Request()
		authUser goth.User
		userData user.User
		token    string
		provider string
	)

	if _, ok := c.Request().Context().Value(MiddlewareUserKey).(user.User); ok {
		res.Header().Set("Location", getReferer(req))
		res.WriteHeader(http.StatusTemporaryRedirect)
		return
	}
	if provider, err = gothic.GetProviderName(req); err != nil {
		slog.ErrorContext(ctx, "Fail to complete user auth", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if _, err = ParseProvider(provider); err != nil {
		slog.ErrorContext(ctx, fmt.Sprintf("Unexpected provider %s", provider), "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if authUser, err = gothic.CompleteUserAuth(res, req); err != nil {
		slog.ErrorContext(ctx, "Fail to complete user auth", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if userData, err = h.service.Auth(ctx, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to get user information from database", "error", err.Error())
		return c.JSON(500, map[string]any{
			"error": err.Error(),
		})
	}
	if token, err = session.GenerateJWT(userData.ID, authUser); err != nil {
		slog.ErrorContext(ctx, "Fail to generate JWT session", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	if err = server.StoreInSession(token, req, res); err != nil {
		slog.ErrorContext(ctx, "Fail to save session on session manager", "error", err.Error())
		fmt.Fprintln(res, err)
		return
	}
	res.Header().Set("Location", getReferer(req))
	res.WriteHeader(http.StatusTemporaryRedirect)
	return nil
}

func CheckCurrentSession(res http.ResponseWriter, req *http.Request) (us session.UserSession, err error) {
	var token string
	if token, err = server.GetFromSession(req); err != nil {
		return us, err
	}
	if us, err = session.UnmarshalSession(token); err != nil {
		return us, err
	}
	return
}

func getReferer(req *http.Request) string {
	referer := req.Header.Get("Referer-c")
	if lo.IsEmpty(referer) {
		referer = "/"
	}
	return referer
}
