package main

import (
	"flag"
	"os"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"gopkg.in/yaml.v3"

	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/biz"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/data"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/server"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/service"
)

func main() {
	confPath := flag.String("conf", "./configs", "config file path (directory containing config.yaml)")
	flag.Parse()

	cfgData, err := os.ReadFile(*confPath + "/config.yaml")
	if err != nil {
		panic("read config: " + err.Error())
	}

	var c conf.Config
	if err := yaml.Unmarshal(cfgData, &c); err != nil {
		panic("parse config: " + err.Error())
	}

	logger := log.NewStdLogger(os.Stdout)
	log.SetLogger(logger)

	// Defaults if empty
	if c.Server.GRPC.Addr == "" {
		c.Server.GRPC.Addr = "0.0.0.0:9003"
	}

	dataData, cleanup, err := data.NewData(&c, logger)
	if err != nil {
		panic("data: " + err.Error())
	}
	defer cleanup()

	commentRepo := data.NewCommentRepo(dataData)
	commentUc := biz.NewCommentUsecase(commentRepo)
	commentSvc := service.NewCommentService(commentUc, logger)

	gs := server.NewGRPCServer(&c, commentSvc, logger)

	app := kratos.New(
		kratos.Name("comment"),
		kratos.Server(gs),
	)

	if err := app.Run(); err != nil {
		panic("run app: " + err.Error())
	}
}
