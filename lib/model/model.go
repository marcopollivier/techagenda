package model

import (
	"time"

	"gorm.io/gorm"
)

// Model replaces gorm.Model with int64 IDs to safely handle CockroachDB BIGSERIAL
// values that exceed JavaScript's Number.MAX_SAFE_INTEGER (2^53-1).
// The json:",string" tag serializes IDs as JSON strings, and ts_type:"string"
// ensures the TypeScript code generator outputs string types.
type Model struct {
	ID        int64          `gorm:"primaryKey" json:"ID,string" ts_type:"string"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
