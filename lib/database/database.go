package database

import (
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/samber/lo"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/marcopollivier/techagenda/lib/config"
)

func NewDB() *gorm.DB {
	cfg := config.Get()
	db, err := gorm.Open(postgres.Open(BuildDSN(cfg)), &gorm.Config{
		Logger: gormlogger(),
	})
	if err != nil {
		slog.Error(fmt.Sprintf("Fail to connect db %s", cfg.DB.Host), "error", err.Error())
		panic(err)
	}
	return db
}

func BuildDSN(cfg config.Config) string {
	if lo.IsNotEmpty(cfg.DB.URL) {
		slog.Info("Connecting with DB URL")
		return cfg.DB.URL
	}
	slog.Info("Connecting with DB config")
	baseDSN := fmt.Sprintf("host=%s port=%d dbname=%s user=%s sslmode=%s TimeZone=UTC", cfg.DB.Host, cfg.DB.Port, cfg.DB.Name, cfg.DB.User, cfg.DB.SSLMode)
	if lo.IsNotEmpty(cfg.DB.Pass) {
		baseDSN += fmt.Sprintf(" password=%s", cfg.DB.Pass)
	}
	return baseDSN
}

func gormlogger() logger.Interface {
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second, // Slow SQL threshold
			LogLevel:                  logger.Info, // Log level
			IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      true,        // Don't include params in the SQL log
			Colorful:                  true,        // Disable color
		},
	)
	return newLogger
}
