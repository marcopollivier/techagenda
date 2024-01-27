package cmd

import (
	"context"
	"database/sql"
	"log"
	"log/slog"

	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
	"github.com/spf13/cobra"

	"github.com/marcopollivier/techagenda/lib/config"
	"github.com/marcopollivier/techagenda/lib/database"
	_ "github.com/marcopollivier/techagenda/lib/logger"
	_ "github.com/marcopollivier/techagenda/migrations"
)

func init() {
	rootCmd.AddCommand(migratorCmd)
	migratorCmd.Flags().StringVarP(&dir, "dir", "d", "./migrations", "directory with migration files")
}

var (
	dir         string
	migratorCmd = &cobra.Command{
		Use:   "migrator",
		Short: "migrator uses the goose migrator application under the hood",
		RunE: func(cmd *cobra.Command, args []string) (err error) {
			var (
				cfg       = config.Get()
				dsn       = database.BuildDSN(cfg)
				db        *sql.DB
				arguments = []string{}
				command   = args[0]
			)
			slog.Info("Running migrator command!", "cmd", command, "args", args)
			if db, err = goose.OpenDBWithDriver("postgres", dsn); err != nil {
				slog.Error("goose: failed to open DB", "error", err.Error())
				return err
			}

			defer func() {
				if err = db.Close(); err != nil {
					log.Fatalf("goose: failed to close DB: %v\n", err)
				}
			}()

			if len(args) > 1 {
				arguments = append(arguments, args[1:]...)
			}

			if err = goose.RunContext(context.Background(), command, db, dir, arguments...); err != nil {
				log.Fatalf("goose %v: %v", command, err)
			}
			return
		},
	}
)
