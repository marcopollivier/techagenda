package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upAddAvatarAndBioToUser, downAddAvatarAndBioToUser)
}

func upAddAvatarAndBioToUser(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
	ALTER TABLE users ADD bio TEXT;
	ALTER TABLE users ADD avatar TEXT;
	`)
	return err
}

func downAddAvatarAndBioToUser(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		ALTER TABLE users DROP COLUMN bio;
		ALTER TABLE users DROP COLUMN avatar;
	`)
	return err
}
