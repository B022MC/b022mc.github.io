package service

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/article/internal/biz"
)

type ArticleService struct {
	v1.UnimplementedArticleServiceServer

	uc  *biz.ArticleUsecase
	log *log.Helper
}

func NewArticleService(uc *biz.ArticleUsecase, logger log.Logger) *ArticleService {
	return &ArticleService{uc: uc, log: log.NewHelper(logger)}
}

func (s *ArticleService) CreateArticle(ctx context.Context, req *v1.CreateArticleRequest) (*v1.ArticleReply, error) {
	art := &biz.Article{
		Title:      req.GetTitle(),
		Summary:    req.GetSummary(),
		Content:    req.GetContent(),
		CoverImage: req.GetCoverImage(),
		Tags:       req.GetTags(),
	}
	result, err := s.uc.CreateArticle(ctx, art)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "create article: %v", err)
	}
	return &v1.ArticleReply{Article: toProtoArticle(result)}, nil
}

func (s *ArticleService) UpdateArticle(ctx context.Context, req *v1.UpdateArticleRequest) (*v1.ArticleReply, error) {
	art := &biz.Article{
		ID:         req.GetId(),
		Title:      req.GetTitle(),
		Summary:    req.GetSummary(),
		Content:    req.GetContent(),
		CoverImage: req.GetCoverImage(),
		Tags:       req.GetTags(),
	}
	err := s.uc.UpdateArticle(ctx, art)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "update article: %v", err)
	}
	result, err := s.uc.GetByID(ctx, art.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get article: %v", err)
	}
	if result == nil {
		return nil, status.Errorf(codes.NotFound, "article not found")
	}
	return &v1.ArticleReply{Article: toProtoArticle(result)}, nil
}

func (s *ArticleService) DeleteArticle(ctx context.Context, req *v1.DeleteArticleRequest) (*v1.EmptyReply, error) {
	err := s.uc.DeleteArticle(ctx, req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "delete article: %v", err)
	}
	return &v1.EmptyReply{}, nil
}

func (s *ArticleService) GetArticle(ctx context.Context, req *v1.GetArticleRequest) (*v1.ArticleReply, error) {
	result, err := s.uc.GetBySlug(ctx, req.GetSlug())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get article: %v", err)
	}
	if result == nil {
		return nil, status.Errorf(codes.NotFound, "article not found")
	}
	return &v1.ArticleReply{Article: toProtoArticle(result)}, nil
}

func (s *ArticleService) ListArticles(ctx context.Context, req *v1.ListArticlesRequest) (*v1.ListArticlesReply, error) {
	page := req.GetPage()
	if page < 1 {
		page = 1
	}
	pageSize := req.GetPageSize()
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	items, total, err := s.uc.List(ctx, page, pageSize, req.GetTag())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list articles: %v", err)
	}
	protoItems := make([]*v1.Article, len(items))
	for i, a := range items {
		protoItems[i] = toProtoArticle(a)
	}
	return &v1.ListArticlesReply{Items: protoItems, Total: total}, nil
}

func (s *ArticleService) SearchArticles(ctx context.Context, req *v1.SearchArticlesRequest) (*v1.ListArticlesReply, error) {
	page := req.GetPage()
	if page < 1 {
		page = 1
	}
	pageSize := req.GetPageSize()
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	items, total, err := s.uc.Search(ctx, req.GetQuery(), page, pageSize)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "search articles: %v", err)
	}
	protoItems := make([]*v1.Article, len(items))
	for i, a := range items {
		protoItems[i] = toProtoArticle(a)
	}
	return &v1.ListArticlesReply{Items: protoItems, Total: total}, nil
}

func (s *ArticleService) ListTags(ctx context.Context, req *v1.EmptyRequest) (*v1.ListTagsReply, error) {
	tags, err := s.uc.ListTags(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list tags: %v", err)
	}
	return &v1.ListTagsReply{Tags: tags}, nil
}

func toProtoArticle(a *biz.Article) *v1.Article {
	return &v1.Article{
		Id:         a.ID,
		Slug:       a.Slug,
		Title:      a.Title,
		Summary:    a.Summary,
		Content:    a.Content,
		CoverImage: a.CoverImage,
		Tags:       a.Tags,
		ViewCount:  a.ViewCount,
		CreatedAt:  timestamppb.New(a.CreatedAt),
		UpdatedAt:  timestamppb.New(a.UpdatedAt),
	}
}
