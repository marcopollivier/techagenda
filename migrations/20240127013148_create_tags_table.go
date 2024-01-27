package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateTagsTable, downCreateTagsTable)
}

func upCreateTagsTable(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS tags (
			id          BIGSERIAL PRIMARY KEY,
			tag         TEXT NOT NULL,
			created_at  TIMESTAMP DEFAULT now(),
			updated_at  TIMESTAMP DEFAULT now(),
			deleted_at	TIMESTAMP,
			UNIQUE(tag)
		);

		CREATE TABLE IF NOT EXISTS events_tags (
			event_id  BIGINT NOT NULL REFERENCES events(id),
			tag_id    BIGINT NOT NULL REFERENCES tags(id)
		);
		CREATE UNIQUE INDEX ON events_tags (event_id, tag_id);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateTagsTable(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		DROP TABLE events_tags
		DROP TABLE tags
	`)
	return err
}
