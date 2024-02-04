package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateEventsTable, downCreateEventsTable)
}

func upCreateEventsTable(ctx context.Context, tx *sql.Tx) error {
	// Events
	if _, err := tx.ExecContext(ctx, `
		CREATE TYPE EventTypeOf AS ENUM ('online', 'in_person');

		CREATE TABLE IF NOT EXISTS events (
			id               BIGSERIAL PRIMARY KEY,

			title            TEXT NOT NULL,
			banner           TEXT,
			description      TEXT NOT NULL,
			href             TEXT,
			type_of 		 EventTypeOf [] NOT NULL,
			begin_date       TIMESTAMP NOT NULL,
			end_date         TIMESTAMP NOT NULL,

			user_id	   		 BIGINT NOT NULL REFERENCES users(id),

			created_at  	 TIMESTAMP DEFAULT now(),
			updated_at  	 TIMESTAMP DEFAULT now(),
			deleted_at  	 TIMESTAMP
		);
		CREATE UNIQUE INDEX ON events (href) WHERE href is not null;
		CREATE INDEX ON events (title);
		CREATE INDEX ON events USING GIN (type_of);
		CREATE INDEX ON events (begin_date, end_date);
		CREATE INDEX ON events (created_at);

		CREATE TABLE IF NOT EXISTS events_venues (
			event_id  BIGINT NOT NULL REFERENCES events(id),
			venue_id  BIGINT NOT NULL REFERENCES venues(id)
		);
		CREATE UNIQUE INDEX ON events_venues (event_id, venue_id);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateEventsTable(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		DROP TYPE EventTypeOf
		DROP TABLE events_venues
		DROP TABLE events
	`)
	return err
}
