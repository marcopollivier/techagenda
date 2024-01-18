package migrations

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upCreateUsersTable, downCreateUsersTable)
}

func upCreateUsersTable(ctx context.Context, tx *sql.Tx) error {
	// This code is executed when the migration is applied.

	// Users table
	if _, err := tx.ExecContext(ctx, `

		CREATE TYPE role AS ENUM ('user', 'mod', 'admin');

		CREATE TABLE IF NOT EXISTS users (
			id         BIGSERIAL PRIMARY KEY,
			email      TEXT NOT NULL,
			name       TEXT,
			role	   ROLE DEFAULT 'user',
			created_at TIMESTAMP DEFAULT now(),
			updated_at TIMESTAMP DEFAULT now(),
			deleted_at TIMESTAMP,
		
			UNIQUE(email)
		);
		
		CREATE INDEX idx_users_role on users (role);
	`); err != nil {
		return err
	}

	// OAuth table
	if _, err := tx.ExecContext(ctx, `
		CREATE TYPE provider AS ENUM ('github');
		
		CREATE TABLE IF NOT EXISTS oauths (
			id         BIGSERIAL PRIMARY KEY,
			user_id	   BIGINT NOT NULL,
			provider   PROVIDER NOT NULL,
			identifier TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT now(),
			updated_at TIMESTAMP DEFAULT now(),
			deleted_at TIMESTAMP,
			
			CONSTRAINT fk_oauths_user_id FOREIGN KEY (user_id) REFERENCES users(id),
			UNIQUE(user_id, provider, identifier)
		);
	`); err != nil {
		return err
	}
	return nil
}

func downCreateUsersTable(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		DROP TYPE role
		DROP TABLE users
		DROP TABLE oauths
	`)
	return err
}
