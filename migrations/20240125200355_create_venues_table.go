package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateVenuesTable, downCreateVenuesTable)
}

func upCreateVenuesTable(ctx context.Context, tx *sql.Tx) error {
	// Venue
	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS venues (
			id               BIGSERIAL PRIMARY KEY,

			alias          TEXT NOT NULL,
			address        TEXT NOT NULL,
			city           TEXT NOT NULL,
			lat            TEXT NOT NULL,
			long           TEXT NOT NULL,

			created_at  	 TIMESTAMP DEFAULT now(),
			updated_at  	 TIMESTAMP DEFAULT now(),
			deleted_at  	 TIMESTAMP,

			UNIQUE(address)
		);

		CREATE INDEX ON venues (alias);
		CREATE INDEX ON venues (city);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateVenuesTable(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		DROP TABLE venues
	`)
	return err
}
