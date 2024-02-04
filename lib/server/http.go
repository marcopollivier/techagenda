package server

import (
	"bytes"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/markbates/goth/gothic"
	"go.uber.org/fx"

	"github.com/marcopollivier/techagenda/lib/config"
)

const (
	SessionName  = "_tech_agenda_s"
	CurrentState = "sess"
)

var (
	sessionStorage atomic.Value
)

func NewHTTPServer(lc fx.Lifecycle) *echo.Echo {
	srv := echo.New()
	cfg := config.Get()
	maxAge := 30 * (24 * time.Hour)
	sessionManager := sessions.NewCookieStore([]byte("secret"))
	sessionManager.MaxAge(int(maxAge.Milliseconds()))
	srv.Use(session.Middleware(sessionManager))
	gothic.Store = sessionManager
	sessionStorage.Store(sessionManager)

	lc.Append(fx.Hook{
		OnStart: func(_ context.Context) error {
			slog.Info(fmt.Sprintf("Starting HTTP server at %d", cfg.HTTPPort))
			go func() {

				if err := srv.Start(fmt.Sprintf(":%d", cfg.HTTPPort)); err != nil {
					slog.Error("Fail to start http server", "error", err)
					panic(err)
				}
			}()
			return nil
		},
		OnStop: srv.Shutdown,
	})
	return srv
}

func GetSessionStorage() *sessions.CookieStore {
	ss, ok := sessionStorage.Load().(*sessions.CookieStore)
	if !ok {
		return nil
	}
	return ss
}

// StoreInSession stores a specified key/value pair in the session.
func StoreInSession(value string, req *http.Request, res http.ResponseWriter) error {
	session, _ := GetSessionStorage().New(req, SessionName)

	if err := updateSessionValue(session, CurrentState, value); err != nil {
		return err
	}

	return session.Save(req, res)
}

// GetFromSession retrieves a previously-stored value from the session.
// If no value has previously been stored at the specified key, it will return an error.
func GetFromSession(req *http.Request) (string, error) {
	session, _ := GetSessionStorage().Get(req, SessionName)
	value, err := getSessionValue(session, CurrentState)
	if err != nil {
		return "", errors.New("could not find a matching session for this request")
	}

	return value, nil
}

// Logout invalidates a user session.
func Logout(res http.ResponseWriter, req *http.Request) error {
	session, err := GetSessionStorage().Get(req, SessionName)
	if err != nil {
		return err
	}
	session.Options.MaxAge = -1
	session.Values = make(map[interface{}]interface{})
	err = session.Save(req, res)
	if err != nil {
		return errors.New("Could not delete user session ")
	}
	return nil
}

func getSessionValue(session *sessions.Session, key string) (string, error) {
	value := session.Values[key]
	if value == nil {
		return "", fmt.Errorf("could not find a matching session for this request")
	}

	rdata := strings.NewReader(value.(string))
	r, err := gzip.NewReader(rdata)
	if err != nil {
		return "", err
	}
	s, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}

	return string(s), nil
}

func updateSessionValue(session *sessions.Session, key, value string) error {
	var b bytes.Buffer
	gz := gzip.NewWriter(&b)
	if _, err := gz.Write([]byte(value)); err != nil {
		return err
	}
	if err := gz.Flush(); err != nil {
		return err
	}
	if err := gz.Close(); err != nil {
		return err
	}

	session.Values[key] = b.String()
	return nil
}
