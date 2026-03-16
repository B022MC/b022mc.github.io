package service

import (
	"encoding/json"
	"net/http"
	"strconv"

	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/conf"
)

type BlogService struct {
	articleConn *grpc.ClientConn
	userConn    *grpc.ClientConn
	commentConn *grpc.ClientConn
	authSecret  string
}

func NewBlogService(c *conf.Config) (*BlogService, error) {
	articleConn, err := grpc.NewClient(c.Services.Article.Addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	userConn, err := grpc.NewClient(c.Services.User.Addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	commentConn, err := grpc.NewClient(c.Services.Comment.Addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &BlogService{
		articleConn: articleConn,
		userConn:    userConn,
		commentConn: commentConn,
		authSecret:  c.Auth.Secret,
	}, nil
}

func (s *BlogService) Close() {
	s.articleConn.Close()
	s.userConn.Close()
	s.commentConn.Close()
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// Article handlers (proxy to article gRPC service)

func (s *BlogService) ListArticles(ctx kratoshttp.Context) error {
	page, _ := strconv.Atoi(ctx.Query().Get("page"))
	pageSize, _ := strconv.Atoi(ctx.Query().Get("pageSize"))
	tag := ctx.Query().Get("tag")
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	// In production, this would call the article gRPC service
	// For now, return a placeholder response
	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"items":    []interface{}{},
		"total":    0,
		"page":     page,
		"pageSize": pageSize,
		"tag":      tag,
	})
	return nil
}

func (s *BlogService) SearchArticles(ctx kratoshttp.Context) error {
	q := ctx.Query().Get("q")
	page, _ := strconv.Atoi(ctx.Query().Get("page"))
	if page <= 0 {
		page = 1
	}

	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"items": []interface{}{},
		"total": 0,
		"page":  page,
		"query": q,
	})
	return nil
}

func (s *BlogService) GetArticle(ctx kratoshttp.Context) error {
	slug := ctx.Vars().Get("slug")
	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"slug": slug,
	})
	return nil
}

func (s *BlogService) CreateArticle(ctx kratoshttp.Context) error {
	var req struct {
		Title     string   `json:"title"`
		Summary   string   `json:"summary"`
		Content   string   `json:"content"`
		CoverImage string  `json:"coverImage"`
		Tags      []string `json:"tags"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request")
		return nil
	}

	writeJSON(ctx.Response(), http.StatusCreated, map[string]string{
		"message": "article created",
	})
	return nil
}

func (s *BlogService) UpdateArticle(ctx kratoshttp.Context) error {
	writeJSON(ctx.Response(), http.StatusOK, map[string]string{
		"message": "article updated",
	})
	return nil
}

func (s *BlogService) DeleteArticle(ctx kratoshttp.Context) error {
	writeJSON(ctx.Response(), http.StatusOK, map[string]string{
		"message": "article deleted",
	})
	return nil
}

func (s *BlogService) ListTags(ctx kratoshttp.Context) error {
	writeJSON(ctx.Response(), http.StatusOK, []string{})
	return nil
}

// Auth handlers (proxy to user gRPC service)

func (s *BlogService) Login(ctx kratoshttp.Context) error {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request")
		return nil
	}

	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"token": "",
		"user":  nil,
	})
	return nil
}

func (s *BlogService) Register(ctx kratoshttp.Context) error {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request")
		return nil
	}

	writeJSON(ctx.Response(), http.StatusCreated, map[string]interface{}{
		"token": "",
		"user":  nil,
	})
	return nil
}

// Comment handlers (proxy to comment gRPC service)

func (s *BlogService) ListComments(ctx kratoshttp.Context) error {
	writeJSON(ctx.Response(), http.StatusOK, []interface{}{})
	return nil
}

func (s *BlogService) CreateComment(ctx kratoshttp.Context) error {
	var req struct {
		Content  string `json:"content"`
		ParentID int64  `json:"parentId"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request")
		return nil
	}

	writeJSON(ctx.Response(), http.StatusCreated, map[string]string{
		"message": "comment created",
	})
	return nil
}
