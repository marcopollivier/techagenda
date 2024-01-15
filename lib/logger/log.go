package logger

import (
	"context"
	"log/slog"
	"os"
	"sync"

	"github.com/samber/lo"

	"github.com/marcopollivier/techagenda/lib/config"
)

var once sync.Once

func init() {
	once.Do(func() {
		cfg := config.Get()

		handler := lo.Switch[string, slog.Handler](cfg.LogFormat).
			Case("json", slog.NewJSONHandler(os.Stdout, nil)).
			Default(slog.NewTextHandler(os.Stdout, nil))

		l := slog.New(handler).
			With(
				"env", cfg.Environment,
				"version", config.Version(),
			)

		level := lo.Switch[string, slog.Level](cfg.LogLevel).
			Case("info", slog.LevelInfo).
			Case("warn", slog.LevelWarn).
			Case("error", slog.LevelError).
			Default(slog.LevelDebug)

		l.Enabled(context.Background(), level)

		slog.SetDefault(l)
	})
}
