package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateCfpsTable, downCreateCfpsTable)
}

func upCreateCfpsTable(ctx context.Context, tx *sql.Tx) error {
	// CallForPapers
	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS cfps (
			id               BIGSERIAL PRIMARY KEY,
			event_id	     BIGINT NOT NULL REFERENCES events(id),
			href             TEXT NOT NULL,
			begin_date       TIMESTAMP NOT NULL,
			end_date         TIMESTAMP NOT NULL,
			created_at  	 TIMESTAMP DEFAULT now(),
			updated_at  	 TIMESTAMP DEFAULT now(),
			deleted_at  	 TIMESTAMP
		);

		CREATE UNIQUE INDEX ON cfps (href) WHERE href is not null;
		CREATE UNIQUE INDEX ON cfps (event_id);
		CREATE INDEX ON cfps (begin_date, end_date);
		CREATE INDEX ON cfps (created_at);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateCfpsTable(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		DROP TABLE cfps
	`)
	return err
}
