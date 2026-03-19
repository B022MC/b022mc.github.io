package service

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/blog-api/internal/conf"
)

type BlogService struct {
	articleConn *grpc.ClientConn
	userConn    *grpc.ClientConn
	commentConn *grpc.ClientConn

	article v1.ArticleServiceClient
	user    v1.UserServiceClient
	comment v1.CommentServiceClient

	authSecret string
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
		article:     v1.NewArticleServiceClient(articleConn),
		user:        v1.NewUserServiceClient(userConn),
		comment:     v1.NewCommentServiceClient(commentConn),
		authSecret:  c.Auth.Secret,
	}, nil
}

func (s *BlogService) Close() {
	s.articleConn.Close()
	s.userConn.Close()
	s.commentConn.Close()
}

func (s *BlogService) AuthSecret() string {
	return s.authSecret
}

func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, statusCode int, msg string) {
	writeJSON(w, statusCode, map[string]string{"error": msg})
}

func grpcStatusCode(err error) int {
	if s, ok := status.FromError(err); ok {
		switch s.Code() {
		case 3: // InvalidArgument
			return http.StatusBadRequest
		case 5: // NotFound
			return http.StatusNotFound
		case 6: // AlreadyExists
			return http.StatusConflict
		case 16: // Unauthenticated
			return http.StatusUnauthorized
		case 7: // PermissionDenied
			return http.StatusForbidden
		}
	}
	return http.StatusInternalServerError
}

func grpcErrorMsg(err error) string {
	if s, ok := status.FromError(err); ok {
		return s.Message()
	}
	return err.Error()
}

type articleJSON struct {
	ID         int64    `json:"id"`
	Slug       string   `json:"slug"`
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Content    string   `json:"content"`
	CoverImage string   `json:"coverImage,omitempty"`
	Tags       []string `json:"tags"`
	ViewCount  int64    `json:"viewCount"`
	CreatedAt  string   `json:"createdAt"`
	UpdatedAt  string   `json:"updatedAt"`
}

func toArticleJSON(a *v1.Article) *articleJSON {
	if a == nil {
		return nil
	}
	tags := a.GetTags()
	if tags == nil {
		tags = []string{}
	}
	var createdAt, updatedAt string
	if a.GetCreatedAt() != nil {
		createdAt = a.GetCreatedAt().AsTime().Format("2006-01-02T15:04:05Z")
	}
	if a.GetUpdatedAt() != nil {
		updatedAt = a.GetUpdatedAt().AsTime().Format("2006-01-02T15:04:05Z")
	}
	return &articleJSON{
		ID:         a.GetId(),
		Slug:       a.GetSlug(),
		Title:      a.GetTitle(),
		Summary:    a.GetSummary(),
		Content:    a.GetContent(),
		CoverImage: a.GetCoverImage(),
		Tags:       tags,
		ViewCount:  a.GetViewCount(),
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
}

type commentJSON struct {
	ID        int64          `json:"id"`
	ArticleID int64          `json:"articleId"`
	ParentID  int64          `json:"parentId"`
	UserID    int64          `json:"userId"`
	Username  string         `json:"username"`
	Content   string         `json:"content"`
	CreatedAt string         `json:"createdAt"`
	Children  []*commentJSON `json:"children,omitempty"`
}

func toCommentJSON(c *v1.Comment) *commentJSON {
	if c == nil {
		return nil
	}
	var createdAt string
	if c.GetCreatedAt() != nil {
		createdAt = c.GetCreatedAt().AsTime().Format("2006-01-02T15:04:05Z")
	}
	var children []*commentJSON
	for _, ch := range c.GetChildren() {
		children = append(children, toCommentJSON(ch))
	}
	return &commentJSON{
		ID:        c.GetId(),
		ArticleID: c.GetArticleId(),
		ParentID:  c.GetParentId(),
		UserID:    c.GetUserId(),
		Username:  c.GetUsername(),
		Content:   c.GetContent(),
		CreatedAt: createdAt,
		Children:  children,
	}
}

type userJSON struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar,omitempty"`
}

func toUserJSON(u *v1.User) *userJSON {
	if u == nil {
		return nil
	}
	return &userJSON{
		ID:       u.GetId(),
		Username: u.GetUsername(),
		Email:    u.GetEmail(),
		Avatar:   u.GetAvatar(),
	}
}

// --- Article handlers ---

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

	reply, err := s.article.ListArticles(ctx, &v1.ListArticlesRequest{
		Page:     int32(page),
		PageSize: int32(pageSize),
		Tag:      tag,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}

	items := make([]*articleJSON, 0, len(reply.GetItems()))
	for _, a := range reply.GetItems() {
		items = append(items, toArticleJSON(a))
	}

	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"items":    items,
		"total":    reply.GetTotal(),
		"page":     page,
		"pageSize": pageSize,
	})
	return nil
}

func (s *BlogService) SearchArticles(ctx kratoshttp.Context) error {
	q := ctx.Query().Get("q")
	page, _ := strconv.Atoi(ctx.Query().Get("page"))
	pageSize, _ := strconv.Atoi(ctx.Query().Get("pageSize"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	reply, err := s.article.SearchArticles(ctx, &v1.SearchArticlesRequest{
		Query:    q,
		Page:     int32(page),
		PageSize: int32(pageSize),
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}

	items := make([]*articleJSON, 0, len(reply.GetItems()))
	for _, a := range reply.GetItems() {
		items = append(items, toArticleJSON(a))
	}

	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"items":    items,
		"total":    reply.GetTotal(),
		"page":     page,
		"pageSize": pageSize,
	})
	return nil
}

func (s *BlogService) GetArticle(ctx kratoshttp.Context) error {
	slug := ctx.Vars().Get("slug")
	reply, err := s.article.GetArticle(ctx, &v1.GetArticleRequest{Slug: slug})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	writeJSON(ctx.Response(), http.StatusOK, toArticleJSON(reply.GetArticle()))
	return nil
}

func (s *BlogService) CreateArticle(ctx kratoshttp.Context) error {
	var req struct {
		Title      string   `json:"title"`
		Summary    string   `json:"summary"`
		Content    string   `json:"content"`
		CoverImage string   `json:"coverImage"`
		Tags       []string `json:"tags"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request body")
		return nil
	}

	reply, err := s.article.CreateArticle(ctx, &v1.CreateArticleRequest{
		Title:      req.Title,
		Summary:    req.Summary,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		Tags:       req.Tags,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	writeJSON(ctx.Response(), http.StatusCreated, toArticleJSON(reply.GetArticle()))
	return nil
}

func (s *BlogService) UpdateArticle(ctx kratoshttp.Context) error {
	idStr := ctx.Vars().Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid article id")
		return nil
	}

	var req struct {
		Title      string   `json:"title"`
		Summary    string   `json:"summary"`
		Content    string   `json:"content"`
		CoverImage string   `json:"coverImage"`
		Tags       []string `json:"tags"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request body")
		return nil
	}

	reply, err := s.article.UpdateArticle(ctx, &v1.UpdateArticleRequest{
		Id:         id,
		Title:      req.Title,
		Summary:    req.Summary,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		Tags:       req.Tags,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	writeJSON(ctx.Response(), http.StatusOK, toArticleJSON(reply.GetArticle()))
	return nil
}

func (s *BlogService) DeleteArticle(ctx kratoshttp.Context) error {
	idStr := ctx.Vars().Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid article id")
		return nil
	}

	_, err = s.article.DeleteArticle(ctx, &v1.DeleteArticleRequest{Id: id})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	writeJSON(ctx.Response(), http.StatusOK, map[string]string{"message": "article deleted"})
	return nil
}

func (s *BlogService) ListTags(ctx kratoshttp.Context) error {
	reply, err := s.article.ListTags(ctx, &v1.EmptyRequest{})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	tags := reply.GetTags()
	if tags == nil {
		tags = []string{}
	}
	writeJSON(ctx.Response(), http.StatusOK, tags)
	return nil
}

// --- Auth handlers ---

func (s *BlogService) Login(ctx kratoshttp.Context) error {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request body")
		return nil
	}

	reply, err := s.user.Login(ctx, &v1.LoginRequest{
		Username: req.Username,
		Password: req.Password,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}

	writeJSON(ctx.Response(), http.StatusOK, map[string]interface{}{
		"token": reply.GetToken(),
		"user":  toUserJSON(reply.GetUser()),
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
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request body")
		return nil
	}

	reply, err := s.user.Register(ctx, &v1.RegisterRequest{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}

	writeJSON(ctx.Response(), http.StatusCreated, map[string]interface{}{
		"token": reply.GetToken(),
		"user":  toUserJSON(reply.GetUser()),
	})
	return nil
}

// --- Comment handlers ---

func (s *BlogService) ListComments(ctx kratoshttp.Context) error {
	articleIDStr := ctx.Vars().Get("articleId")
	articleID, err := strconv.ParseInt(articleIDStr, 10, 64)
	if err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid article id")
		return nil
	}

	reply, err := s.comment.ListComments(ctx, &v1.ListCommentsRequest{
		ArticleId: articleID,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}

	comments := make([]*commentJSON, 0, len(reply.GetComments()))
	for _, c := range reply.GetComments() {
		comments = append(comments, toCommentJSON(c))
	}
	writeJSON(ctx.Response(), http.StatusOK, comments)
	return nil
}

func (s *BlogService) CreateComment(ctx kratoshttp.Context) error {
	articleIDStr := ctx.Vars().Get("articleId")
	articleID, err := strconv.ParseInt(articleIDStr, 10, 64)
	if err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid article id")
		return nil
	}

	var req struct {
		Content  string `json:"content"`
		ParentID int64  `json:"parentId"`
	}
	if err := ctx.Bind(&req); err != nil {
		writeError(ctx.Response(), http.StatusBadRequest, "invalid request body")
		return nil
	}

	userID := getUserIDFromContext(ctx)

	reply, err := s.comment.CreateComment(ctx, &v1.CreateCommentRequest{
		ArticleId: articleID,
		ParentId:  req.ParentID,
		UserId:    userID,
		Content:   req.Content,
	})
	if err != nil {
		writeError(ctx.Response(), grpcStatusCode(err), grpcErrorMsg(err))
		return nil
	}
	writeJSON(ctx.Response(), http.StatusCreated, toCommentJSON(reply.GetComment()))
	return nil
}

func getUserIDFromContext(ctx kratoshttp.Context) int64 {
	auth := ctx.Request().Header.Get("Authorization")
	if auth == "" {
		return 0
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return 0
	}
	if uid, ok := ctx.Request().Context().Value(userIDKey).(int64); ok {
		return uid
	}
	return 0
}

type contextKey string

const userIDKey contextKey = "user_id"
