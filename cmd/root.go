package cmd

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/spf13/cobra"
	"go.uber.org/fx"

	"github.com/marcopollivier/techagenda/internal/static"
	"github.com/marcopollivier/techagenda/internal/user"
	"github.com/marcopollivier/techagenda/lib/database"
	_ "github.com/marcopollivier/techagenda/lib/logger"
	"github.com/marcopollivier/techagenda/lib/server"
)

var rootCmd = &cobra.Command{
	Use:   "run",
	Short: "Run is the command that run tech agenda service",
	Run: func(_ *cobra.Command, _ []string) {
		slog.Info("Starting tech agenda service!")

		fx.New(
			fx.Provide(database.NewDB),
			fx.Provide(server.NewHTTPServer),
			static.Module(),
			user.Module(),
			// event.Module(),
			// attendee.Module(),
		).Run()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
