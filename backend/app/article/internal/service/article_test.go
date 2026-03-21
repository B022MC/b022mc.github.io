package service

import (
	"context"
	"errors"
	"io"
	"testing"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/article/internal/biz"
)

type articleRepoStub struct {
	createFn  func(context.Context, *biz.Article) (*biz.Article, error)
	updateFn  func(context.Context, *biz.Article) error
	deleteFn  func(context.Context, int64) error
	getByID   func(context.Context, int64) (*biz.Article, error)
	getBySlug func(context.Context, string) (*biz.Article, error)
	listFn    func(context.Context, int32, int32, string) ([]*biz.Article, int64, error)
	searchFn  func(context.Context, string, int32, int32) ([]*biz.Article, int64, error)
	tagsFn    func(context.Context) ([]string, error)
}

func (s articleRepoStub) CreateArticle(ctx context.Context, article *biz.Article) (*biz.Article, error) {
	return s.createFn(ctx, article)
}

func (s articleRepoStub) UpdateArticle(ctx context.Context, article *biz.Article) error {
	return s.updateFn(ctx, article)
}

func (s articleRepoStub) DeleteArticle(ctx context.Context, id int64) error {
	return s.deleteFn(ctx, id)
}

func (s articleRepoStub) GetByID(ctx context.Context, id int64) (*biz.Article, error) {
	return s.getByID(ctx, id)
}

func (s articleRepoStub) GetBySlug(ctx context.Context, slug string) (*biz.Article, error) {
	return s.getBySlug(ctx, slug)
}

func (s articleRepoStub) List(ctx context.Context, page, pageSize int32, tag string) ([]*biz.Article, int64, error) {
	return s.listFn(ctx, page, pageSize, tag)
}

func (s articleRepoStub) Search(ctx context.Context, query string, page, pageSize int32) ([]*biz.Article, int64, error) {
	return s.searchFn(ctx, query, page, pageSize)
}

func (s articleRepoStub) ListTags(ctx context.Context) ([]string, error) {
	return s.tagsFn(ctx)
}

func newArticleServiceForTest(repo articleRepoStub) *ArticleService {
	return NewArticleService(biz.NewArticleUsecase(repo), log.NewStdLogger(io.Discard))
}

func TestArticleServiceCreateArticle(t *testing.T) {
	timestamp := time.Date(2026, 3, 21, 12, 0, 0, 0, time.UTC)
	var captured *biz.Article
	svc := newArticleServiceForTest(articleRepoStub{
		createFn: func(_ context.Context, article *biz.Article) (*biz.Article, error) {
			captured = article
			return &biz.Article{
				ID:         7,
				Slug:       "hello-world",
				Title:      article.Title,
				Summary:    article.Summary,
				Content:    article.Content,
				CoverImage: article.CoverImage,
				Tags:       article.Tags,
				CreatedAt:  timestamp,
				UpdatedAt:  timestamp,
			}, nil
		},
		updateFn:  func(context.Context, *biz.Article) error { return nil },
		deleteFn:  func(context.Context, int64) error { return nil },
		getByID:   func(context.Context, int64) (*biz.Article, error) { return nil, nil },
		getBySlug: func(context.Context, string) (*biz.Article, error) { return nil, nil },
		listFn:    func(context.Context, int32, int32, string) ([]*biz.Article, int64, error) { return nil, 0, nil },
		searchFn:  func(context.Context, string, int32, int32) ([]*biz.Article, int64, error) { return nil, 0, nil },
		tagsFn:    func(context.Context) ([]string, error) { return nil, nil },
	})

	reply, err := svc.CreateArticle(context.Background(), &v1.CreateArticleRequest{
		Title:      " Hello World ",
		Summary:    "summary",
		Content:    "content",
		CoverImage: "cover.png",
		Tags:       []string{"Go", "Kratos"},
	})
	if err != nil {
		t.Fatalf("CreateArticle returned error: %v", err)
	}

	if captured == nil || captured.Title != " Hello World " || len(captured.Tags) != 2 {
		t.Fatalf("service did not forward article payload correctly: %#v", captured)
	}
	if reply.GetArticle().GetSlug() != "hello-world" {
		t.Fatalf("unexpected slug: %s", reply.GetArticle().GetSlug())
	}
}

func TestArticleServiceUpdateArticleReturnsNotFoundWhenUsecaseLookupMisses(t *testing.T) {
	svc := newArticleServiceForTest(articleRepoStub{
		createFn:  func(context.Context, *biz.Article) (*biz.Article, error) { return nil, nil },
		updateFn:  func(context.Context, *biz.Article) error { return nil },
		deleteFn:  func(context.Context, int64) error { return nil },
		getByID:   func(context.Context, int64) (*biz.Article, error) { return nil, nil },
		getBySlug: func(context.Context, string) (*biz.Article, error) { return nil, nil },
		listFn:    func(context.Context, int32, int32, string) ([]*biz.Article, int64, error) { return nil, 0, nil },
		searchFn:  func(context.Context, string, int32, int32) ([]*biz.Article, int64, error) { return nil, 0, nil },
		tagsFn:    func(context.Context) ([]string, error) { return nil, nil },
	})

	_, err := svc.UpdateArticle(context.Background(), &v1.UpdateArticleRequest{Id: 42})
	if status.Code(err) != codes.NotFound {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestArticleServiceListArticlesNormalizesPagination(t *testing.T) {
	var gotPage, gotPageSize int32
	var gotTag string
	svc := newArticleServiceForTest(articleRepoStub{
		createFn:  func(context.Context, *biz.Article) (*biz.Article, error) { return nil, nil },
		updateFn:  func(context.Context, *biz.Article) error { return nil },
		deleteFn:  func(context.Context, int64) error { return nil },
		getByID:   func(context.Context, int64) (*biz.Article, error) { return nil, nil },
		getBySlug: func(context.Context, string) (*biz.Article, error) { return nil, nil },
		listFn: func(_ context.Context, page, pageSize int32, tag string) ([]*biz.Article, int64, error) {
			gotPage, gotPageSize, gotTag = page, pageSize, tag
			return []*biz.Article{{ID: 1, Title: "test", CreatedAt: time.Now(), UpdatedAt: time.Now()}}, 1, nil
		},
		searchFn: func(context.Context, string, int32, int32) ([]*biz.Article, int64, error) { return nil, 0, nil },
		tagsFn:   func(context.Context) ([]string, error) { return nil, nil },
	})

	_, err := svc.ListArticles(context.Background(), &v1.ListArticlesRequest{
		Page:     0,
		PageSize: 101,
		Tag:      "go",
	})
	if err != nil {
		t.Fatalf("ListArticles returned error: %v", err)
	}

	if gotPage != 1 || gotPageSize != 10 || gotTag != "go" {
		t.Fatalf("unexpected pagination values: page=%d pageSize=%d tag=%q", gotPage, gotPageSize, gotTag)
	}
}

func TestArticleServiceDeleteArticlePropagatesInternalError(t *testing.T) {
	svc := newArticleServiceForTest(articleRepoStub{
		createFn:  func(context.Context, *biz.Article) (*biz.Article, error) { return nil, nil },
		updateFn:  func(context.Context, *biz.Article) error { return nil },
		deleteFn:  func(context.Context, int64) error { return errors.New("db down") },
		getByID:   func(context.Context, int64) (*biz.Article, error) { return nil, nil },
		getBySlug: func(context.Context, string) (*biz.Article, error) { return nil, nil },
		listFn:    func(context.Context, int32, int32, string) ([]*biz.Article, int64, error) { return nil, 0, nil },
		searchFn:  func(context.Context, string, int32, int32) ([]*biz.Article, int64, error) { return nil, 0, nil },
		tagsFn:    func(context.Context) ([]string, error) { return nil, nil },
	})

	_, err := svc.DeleteArticle(context.Background(), &v1.DeleteArticleRequest{Id: 5})
	if status.Code(err) != codes.Internal {
		t.Fatalf("expected internal error, got %v", err)
	}
}
