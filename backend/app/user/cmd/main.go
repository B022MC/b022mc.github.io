package main

import (
	"flag"
	"os"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"gopkg.in/yaml.v3"

	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/biz"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/data"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/server"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/service"
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
		c.Server.GRPC.Addr = "0.0.0.0:9002"
	}

	dataData, cleanup, err := data.NewData(&c, logger)
	if err != nil {
		panic("data: " + err.Error())
	}
	defer cleanup()

	userRepo := data.NewUserRepo(dataData)
	userUc := biz.NewUserUsecase(userRepo, &c)
	userSvc := service.NewUserService(userUc, logger)

	gs := server.NewGRPCServer(&c, userSvc, logger)

	app := kratos.New(
		kratos.Name("user"),
		kratos.Server(gs),
	)

	if err := app.Run(); err != nil {
		panic("run app: " + err.Error())
	}
}
