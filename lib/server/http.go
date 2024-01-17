package server

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/labstack/echo/v4"
	"go.uber.org/fx"

	"github.com/marcopollivier/techagenda/lib/config"
)

func NewHTTPServer(lc fx.Lifecycle) *echo.Echo {
	srv := echo.New()
	cfg := config.Get()
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
