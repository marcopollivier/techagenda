package user

import (
	"fmt"
	"log/slog"

	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/github"
	"github.com/samber/lo"

	"github.com/marcopollivier/techagenda/lib/config"
)

func registerProviders() {
	cfg := config.Get()

	goth.UseProviders(
		github.New(
			cfg.Providers.Github.Key,
			cfg.Providers.Github.Secret,
			fmt.Sprintf("%s/auth/github/callback", cfg.AppHost),
			"user",
		),
	)

	pp := lo.Keys(goth.GetProviders())
	slog.Info("set providers", "providers", pp)
}
