package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateAttendeesTable, downCreateAttendeesTable)
}

func upCreateAttendeesTable(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS attendees (
			id               BIGSERIAL PRIMARY KEY,

			full_name        TEXT NOT NULL,
			contact_info     TEXT,
			metadata      	 JSONB,
			user_id	   		 BIGINT REFERENCES users(id),
			event_id	     BIGINT REFERENCES events(id),

			created_at  	 TIMESTAMP DEFAULT now(),
			updated_at  	 TIMESTAMP DEFAULT now(),
			deleted_at  	 TIMESTAMP
		);
		CREATE UNIQUE INDEX ON attendees (full_name, event_id);
		CREATE INDEX ON attendees (user_id);
		CREATE INDEX ON attendees (event_id);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateAttendeesTable(ctx context.Context, tx *sql.Tx) error {
	// This code is executed when the migration is rolled back.
	return nil
}
