package server

import (
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/middleware/logging"
	"github.com/go-kratos/kratos/v2/middleware/recovery"
	"github.com/go-kratos/kratos/v2/transport/grpc"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/service"
)

// NewGRPCServer creates a new gRPC server.
func NewGRPCServer(c *conf.Config, svc *service.UserService, logger log.Logger) *grpc.Server {
	srv := grpc.NewServer(
		grpc.Address(c.Server.GRPC.Addr),
		grpc.Middleware(
			recovery.Recovery(),
			logging.Server(logger),
		),
	)
	v1.RegisterUserServiceServer(srv, svc)
	return srv
}
