package server

import (
	"net/http"

	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/conf"
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/service"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/middleware/logging"
	"github.com/go-kratos/kratos/v2/middleware/recovery"
	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func NewHTTPServer(c *conf.Config, svc *service.BlogService, logger log.Logger) *kratoshttp.Server {
	opts := []kratoshttp.ServerOption{
		kratoshttp.Address(c.Server.HTTP.Addr),
		kratoshttp.Middleware(
			recovery.Recovery(),
			logging.Server(logger),
		),
		kratoshttp.Filter(corsMiddleware),
	}

	srv := kratoshttp.NewServer(opts...)

	r := srv.Route("/")

	r.GET("/api/healthz", func(ctx kratoshttp.Context) error {
		ctx.Response().Header().Set("Content-Type", "application/json")
		ctx.Response().WriteHeader(http.StatusOK)
		_, err := ctx.Response().Write([]byte(`{"status":"ok","service":"blog-api"}`))
		return err
	})

	// Public article routes
	r.GET("/api/v1/articles", svc.ListArticles)
	r.GET("/api/v1/articles/search", svc.SearchArticles)
	r.GET("/api/v1/articles/{slug}", svc.GetArticle)
	r.GET("/api/v1/tags", svc.ListTags)

	// Auth routes (public)
	r.POST("/api/v1/auth/login", svc.Login)
	r.POST("/api/v1/auth/register", svc.Register)

	// Public comment routes
	r.GET("/api/v1/articles/{articleId}/comments", svc.ListComments)

	// Protected routes (require JWT)
	authFilter := service.JWTAuthMiddleware(svc.AuthSecret())
	protected := srv.Route("/", authFilter)
	protected.POST("/api/v1/articles", svc.CreateArticle)
	protected.PUT("/api/v1/articles/{id}", svc.UpdateArticle)
	protected.DELETE("/api/v1/articles/{id}", svc.DeleteArticle)
	protected.POST("/api/v1/articles/{articleId}/comments", svc.CreateComment)

	return srv
}
