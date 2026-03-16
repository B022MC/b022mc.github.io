package data

import (
	"context"
	"database/sql"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/redis/go-redis/v9"

	"github.com/b022mc/b022mc.github.io/backend/app/article/internal/conf"
)

type Data struct {
	db    *sql.DB
	redis *redis.Client
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

	rdb := redis.NewClient(&redis.Options{
		Addr:     c.Data.Redis.Addr,
		Password: c.Data.Redis.Password,
		DB:       0,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		db.Close()
		return nil, nil, err
	}

	cleanup := func() {
		db.Close()
		rdb.Close()
		log.NewHelper(logger).Info("closing data resources")
	}

	return &Data{db: db, redis: rdb}, cleanup, nil
}

func (d *Data) DB() *sql.DB {
	return d.db
}

func (d *Data) Redis() *redis.Client {
	return d.redis
}
