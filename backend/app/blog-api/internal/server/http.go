package server

import (
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/service"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/middleware/logging"
	"github.com/go-kratos/kratos/v2/middleware/recovery"
	"github.com/go-kratos/kratos/v2/transport/http"
)

func NewHTTPServer(c *conf.Config, svc *service.BlogService, logger log.Logger) *http.Server {
	opts := []http.ServerOption{
		http.Address(c.Server.HTTP.Addr),
		http.Middleware(
			recovery.Recovery(),
			logging.Server(logger),
		),
	}

	srv := http.NewServer(opts...)

	r := srv.Route("/")

	// Article routes
	r.GET("/api/v1/articles", svc.ListArticles)
	r.GET("/api/v1/articles/search", svc.SearchArticles)
	r.GET("/api/v1/articles/{slug}", svc.GetArticle)
	r.POST("/api/v1/articles", svc.CreateArticle)
	r.PUT("/api/v1/articles/{id}", svc.UpdateArticle)
	r.DELETE("/api/v1/articles/{id}", svc.DeleteArticle)
	r.GET("/api/v1/tags", svc.ListTags)

	// Auth routes
	r.POST("/api/v1/auth/login", svc.Login)
	r.POST("/api/v1/auth/register", svc.Register)

	// Comment routes
	r.GET("/api/v1/articles/{articleId}/comments", svc.ListComments)
	r.POST("/api/v1/articles/{articleId}/comments", svc.CreateComment)

	return srv
}
