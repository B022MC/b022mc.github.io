package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/go-kratos/kratos/v2/middleware"
	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
)

type articleClientStub struct {
	listArticlesFn func(context.Context, *v1.ListArticlesRequest, ...grpc.CallOption) (*v1.ListArticlesReply, error)
}

func (s articleClientStub) CreateArticle(context.Context, *v1.CreateArticleRequest, ...grpc.CallOption) (*v1.ArticleReply, error) {
	return nil, errors.New("unexpected call")
}

func (s articleClientStub) UpdateArticle(context.Context, *v1.UpdateArticleRequest, ...grpc.CallOption) (*v1.ArticleReply, error) {
	return nil, errors.New("unexpected call")
}

func (s articleClientStub) DeleteArticle(context.Context, *v1.DeleteArticleRequest, ...grpc.CallOption) (*v1.EmptyReply, error) {
	return nil, errors.New("unexpected call")
}

func (s articleClientStub) GetArticle(context.Context, *v1.GetArticleRequest, ...grpc.CallOption) (*v1.ArticleReply, error) {
	return nil, errors.New("unexpected call")
}

func (s articleClientStub) ListArticles(ctx context.Context, in *v1.ListArticlesRequest, opts ...grpc.CallOption) (*v1.ListArticlesReply, error) {
	return s.listArticlesFn(ctx, in, opts...)
}

func (s articleClientStub) SearchArticles(context.Context, *v1.SearchArticlesRequest, ...grpc.CallOption) (*v1.ListArticlesReply, error) {
	return nil, errors.New("unexpected call")
}

func (s articleClientStub) ListTags(context.Context, *v1.EmptyRequest, ...grpc.CallOption) (*v1.ListTagsReply, error) {
	return nil, errors.New("unexpected call")
}

type commentClientStub struct {
	createCommentFn func(context.Context, *v1.CreateCommentRequest, ...grpc.CallOption) (*v1.CommentReply, error)
}

func (s commentClientStub) CreateComment(ctx context.Context, in *v1.CreateCommentRequest, opts ...grpc.CallOption) (*v1.CommentReply, error) {
	return s.createCommentFn(ctx, in, opts...)
}

func (s commentClientStub) DeleteComment(context.Context, *v1.DeleteCommentRequest, ...grpc.CallOption) (*v1.EmptyReply, error) {
	return nil, errors.New("unexpected call")
}

func (s commentClientStub) ListComments(context.Context, *v1.ListCommentsRequest, ...grpc.CallOption) (*v1.ListCommentsReply, error) {
	return nil, errors.New("unexpected call")
}

type testContext struct {
	context.Context
	req  *http.Request
	resp *httptest.ResponseRecorder
	vars url.Values
}

func newTestContext(req *http.Request) *testContext {
	return &testContext{
		Context: req.Context(),
		req:     req,
		resp:    httptest.NewRecorder(),
		vars:    url.Values{},
	}
}

func (c *testContext) Vars() url.Values                                      { return c.vars }
func (c *testContext) Query() url.Values                                     { return c.req.URL.Query() }
func (c *testContext) Form() url.Values                                      { return c.req.Form }
func (c *testContext) Header() http.Header                                   { return c.req.Header }
func (c *testContext) Request() *http.Request                                { return c.req }
func (c *testContext) Response() http.ResponseWriter                         { return c.resp }
func (c *testContext) Middleware(next middleware.Handler) middleware.Handler { return next }
func (c *testContext) Bind(v any) error                                      { return json.NewDecoder(c.req.Body).Decode(v) }
func (c *testContext) BindVars(any) error                                    { return nil }
func (c *testContext) BindQuery(any) error                                   { return nil }
func (c *testContext) BindForm(any) error                                    { return nil }
func (c *testContext) Returns(any, error) error                              { return nil }
func (c *testContext) Result(code int, v any) error                          { writeJSON(c.resp, code, v); return nil }
func (c *testContext) JSON(code int, v any) error                            { writeJSON(c.resp, code, v); return nil }
func (c *testContext) XML(int, any) error                                    { return nil }
func (c *testContext) String(code int, text string) error {
	c.resp.WriteHeader(code)
	_, err := c.resp.WriteString(text)
	return err
}
func (c *testContext) Blob(code int, contentType string, data []byte) error {
	c.resp.Header().Set("Content-Type", contentType)
	c.resp.WriteHeader(code)
	_, err := c.resp.Write(data)
	return err
}
func (c *testContext) Stream(code int, contentType string, r io.Reader) error {
	c.resp.Header().Set("Content-Type", contentType)
	c.resp.WriteHeader(code)
	_, err := io.Copy(c.resp, r)
	return err
}
func (c *testContext) Reset(w http.ResponseWriter, r *http.Request) {
	recorder, ok := w.(*httptest.ResponseRecorder)
	if ok {
		c.resp = recorder
	}
	c.req = r
	c.Context = r.Context()
}

var _ kratoshttp.Context = (*testContext)(nil)

func TestGRPCStatusCode(t *testing.T) {
	if got := grpcStatusCode(status.Error(codes.PermissionDenied, "nope")); got != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", got)
	}
	if got := grpcStatusCode(errors.New("plain")); got != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", got)
	}
}

func TestBlogServiceListArticlesWritesNormalizedJSON(t *testing.T) {
	timestamp := time.Date(2026, 3, 21, 12, 0, 0, 0, time.UTC)
	service := &BlogService{
		article: articleClientStub{
			listArticlesFn: func(_ context.Context, req *v1.ListArticlesRequest, _ ...grpc.CallOption) (*v1.ListArticlesReply, error) {
				if req.GetPage() != 1 || req.GetPageSize() != 10 || req.GetTag() != "go" {
					t.Fatalf("unexpected request: %+v", req)
				}
				return &v1.ListArticlesReply{
					Items: []*v1.Article{
						{
							Id:        1,
							Slug:      "hello-world",
							Title:     "Hello",
							CreatedAt: timestamppb.New(timestamp),
							UpdatedAt: timestamppb.New(timestamp),
						},
					},
					Total: 1,
				}, nil
			},
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/articles?page=0&pageSize=0&tag=go", nil)
	ctx := newTestContext(req)

	if err := service.ListArticles(ctx); err != nil {
		t.Fatalf("ListArticles returned error: %v", err)
	}

	if ctx.resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", ctx.resp.Code)
	}
	if body := ctx.resp.Body.String(); !bytes.Contains([]byte(body), []byte(`"page":1`)) || !bytes.Contains([]byte(body), []byte(`"hello-world"`)) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestBlogServiceListArticlesMapsGRPCErrors(t *testing.T) {
	service := &BlogService{
		article: articleClientStub{
			listArticlesFn: func(context.Context, *v1.ListArticlesRequest, ...grpc.CallOption) (*v1.ListArticlesReply, error) {
				return nil, status.Error(codes.NotFound, "missing")
			},
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/articles", nil)
	ctx := newTestContext(req)

	if err := service.ListArticles(ctx); err != nil {
		t.Fatalf("ListArticles returned error: %v", err)
	}
	if ctx.resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", ctx.resp.Code)
	}
	if !bytes.Contains(ctx.resp.Body.Bytes(), []byte(`"error":"missing"`)) {
		t.Fatalf("unexpected body: %s", ctx.resp.Body.String())
	}
}

func TestBlogServiceCreateCommentUsesUserIDFromContext(t *testing.T) {
	service := &BlogService{
		comment: commentClientStub{
			createCommentFn: func(_ context.Context, req *v1.CreateCommentRequest, _ ...grpc.CallOption) (*v1.CommentReply, error) {
				if req.GetArticleId() != 7 || req.GetParentId() != 3 || req.GetUserId() != 99 || req.GetContent() != "hello" {
					t.Fatalf("unexpected request: %+v", req)
				}
				return &v1.CommentReply{
					Comment: &v1.Comment{
						Id:        1,
						ArticleId: req.GetArticleId(),
						ParentId:  req.GetParentId(),
						UserId:    req.GetUserId(),
						Username:  "alice",
						Content:   req.GetContent(),
					},
				}, nil
			},
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/articles/7/comments", bytes.NewBufferString(`{"content":"hello","parentId":3}`))
	req.Header.Set("Authorization", "Bearer token")
	req = req.WithContext(context.WithValue(req.Context(), userIDKey, int64(99)))
	ctx := newTestContext(req)
	ctx.vars.Set("articleId", "7")

	if err := service.CreateComment(ctx); err != nil {
		t.Fatalf("CreateComment returned error: %v", err)
	}

	if ctx.resp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", ctx.resp.Code)
	}
	if !bytes.Contains(ctx.resp.Body.Bytes(), []byte(`"userId":99`)) {
		t.Fatalf("unexpected body: %s", ctx.resp.Body.String())
	}
}
