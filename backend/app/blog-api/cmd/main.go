package main

import (
	"flag"
	"os"
	"path/filepath"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"gopkg.in/yaml.v3"

	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/server"
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/service"
)

var confPath string

func init() {
	flag.StringVar(&confPath, "conf", "configs", "config path")
}

func main() {
	flag.Parse()

	logger := log.With(log.NewStdLogger(os.Stdout),
		"ts", log.DefaultTimestamp,
		"caller", log.DefaultCaller,
		"service.name", "blog-api",
	)

	data, err := os.ReadFile(filepath.Join(confPath, "config.yaml"))
	if err != nil {
		log.NewHelper(logger).Fatalf("failed to read config: %v", err)
	}

	var c conf.Config
	if err := yaml.Unmarshal(data, &c); err != nil {
		log.NewHelper(logger).Fatalf("failed to parse config: %v", err)
	}

	svc, err := service.NewBlogService(&c)
	if err != nil {
		log.NewHelper(logger).Fatalf("failed to create service: %v", err)
	}
	defer svc.Close()

	httpSrv := server.NewHTTPServer(&c, svc, logger)

	app := kratos.New(
		kratos.Name("blog-api"),
		kratos.Logger(logger),
		kratos.Server(httpSrv),
	)

	if err := app.Run(); err != nil {
		log.NewHelper(logger).Fatalf("failed to run app: %v", err)
	}
}
