package biz

import (
	"context"
	"time"
)

type Article struct {
	ID         int64
	Slug       string
	Title      string
	Summary    string
	Content    string
	CoverImage string
	Tags       []string
	ViewCount  int64
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type ArticleRepo interface {
	CreateArticle(ctx context.Context, article *Article) (*Article, error)
	UpdateArticle(ctx context.Context, article *Article) error
	DeleteArticle(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*Article, error)
	GetBySlug(ctx context.Context, slug string) (*Article, error)
	List(ctx context.Context, page, pageSize int32, tag string) ([]*Article, int64, error)
	Search(ctx context.Context, query string, page, pageSize int32) ([]*Article, int64, error)
	ListTags(ctx context.Context) ([]string, error)
}

type ArticleUsecase struct {
	repo ArticleRepo
}

func NewArticleUsecase(repo ArticleRepo) *ArticleUsecase {
	return &ArticleUsecase{repo: repo}
}

func (uc *ArticleUsecase) CreateArticle(ctx context.Context, article *Article) (*Article, error) {
	return uc.repo.CreateArticle(ctx, article)
}

func (uc *ArticleUsecase) UpdateArticle(ctx context.Context, article *Article) error {
	return uc.repo.UpdateArticle(ctx, article)
}

func (uc *ArticleUsecase) DeleteArticle(ctx context.Context, id int64) error {
	return uc.repo.DeleteArticle(ctx, id)
}

func (uc *ArticleUsecase) GetByID(ctx context.Context, id int64) (*Article, error) {
	return uc.repo.GetByID(ctx, id)
}

func (uc *ArticleUsecase) GetBySlug(ctx context.Context, slug string) (*Article, error) {
	return uc.repo.GetBySlug(ctx, slug)
}

func (uc *ArticleUsecase) List(ctx context.Context, page, pageSize int32, tag string) ([]*Article, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	return uc.repo.List(ctx, page, pageSize, tag)
}

func (uc *ArticleUsecase) Search(ctx context.Context, query string, page, pageSize int32) ([]*Article, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	return uc.repo.Search(ctx, query, page, pageSize)
}

func (uc *ArticleUsecase) ListTags(ctx context.Context) ([]string, error) {
	return uc.repo.ListTags(ctx)
}
