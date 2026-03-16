package data

import (
	"database/sql"

	_ "github.com/go-sql-driver/mysql"
	"github.com/go-kratos/kratos/v2/log"

	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/conf"
)

type Data struct {
	db *sql.DB
}

func NewData(c *conf.Config, logger log.Logger) (*Data, func(), error) {
	db, err := sql.Open("mysql", c.Data.Database.Source)
	if err != nil {
		return nil, nil, err
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, nil, err
	}

	cleanup := func() {
		db.Close()
		log.NewHelper(logger).Info("closing data resources")
	}

	return &Data{db: db}, cleanup, nil
}

func (d *Data) DB() *sql.DB {
	return d.db
}
