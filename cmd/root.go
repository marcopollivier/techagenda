package cmd

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/spf13/cobra"
	"go.uber.org/fx"

	"github.com/marcopollivier/techagenda/lib/database"
	_ "github.com/marcopollivier/techagenda/lib/logger"
	"github.com/marcopollivier/techagenda/lib/server"
	"github.com/marcopollivier/techagenda/lib/ssr"
	"github.com/marcopollivier/techagenda/pkg/event"
	"github.com/marcopollivier/techagenda/pkg/lending"
	"github.com/marcopollivier/techagenda/pkg/oauth"
	"github.com/marcopollivier/techagenda/pkg/tag"
	"github.com/marcopollivier/techagenda/pkg/user"
	"github.com/marcopollivier/techagenda/pkg/venue"
)

var rootCmd = &cobra.Command{
	Use:   "run",
	Short: "Run is the command that run tech agenda service",
	Run: func(_ *cobra.Command, _ []string) {
		slog.Info("Starting tech agenda service!")

		fx.New(
			fx.Provide(database.NewDB),
			fx.Provide(server.NewHTTPServer),
			oauth.Module(),
			ssr.Module(),
			user.Module(),
			event.Module(),
			tag.Module(),
			venue.Module(),

			lending.Module(),
		).Run()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
