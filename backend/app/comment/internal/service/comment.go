package service

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/biz"
)

type CommentService struct {
	v1.UnimplementedCommentServiceServer

	uc  *biz.CommentUsecase
	log *log.Helper
}

func NewCommentService(uc *biz.CommentUsecase, logger log.Logger) *CommentService {
	return &CommentService{uc: uc, log: log.NewHelper(logger)}
}

func (s *CommentService) CreateComment(ctx context.Context, req *v1.CreateCommentRequest) (*v1.CommentReply, error) {
	result, err := s.uc.CreateComment(ctx, req.GetArticleId(), req.GetParentId(), req.GetUserId(), req.GetContent())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "create comment: %v", err)
	}
	return &v1.CommentReply{Comment: toProtoComment(result)}, nil
}

func (s *CommentService) DeleteComment(ctx context.Context, req *v1.DeleteCommentRequest) (*v1.EmptyReply, error) {
	err := s.uc.DeleteComment(ctx, req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "delete comment: %v", err)
	}
	return &v1.EmptyReply{}, nil
}

func (s *CommentService) ListComments(ctx context.Context, req *v1.ListCommentsRequest) (*v1.ListCommentsReply, error) {
	tree, err := s.uc.ListComments(ctx, req.GetArticleId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list comments: %v", err)
	}
	protoComments := make([]*v1.Comment, len(tree))
	for i, c := range tree {
		protoComments[i] = toProtoCommentWithChildren(c)
	}
	return &v1.ListCommentsReply{Comments: protoComments}, nil
}

func toProtoComment(c *biz.Comment) *v1.Comment {
	return &v1.Comment{
		Id:        c.ID,
		ArticleId: c.ArticleID,
		ParentId:  c.ParentID,
		UserId:    c.UserID,
		Username:  c.Username,
		Content:   c.Content,
		CreatedAt: timestamppb.New(c.CreatedAt),
		Children:  nil,
	}
}

func toProtoCommentWithChildren(c *biz.Comment) *v1.Comment {
	children := make([]*v1.Comment, len(c.Children))
	for i, ch := range c.Children {
		children[i] = toProtoCommentWithChildren(ch)
	}
	return &v1.Comment{
		Id:        c.ID,
		ArticleId: c.ArticleID,
		ParentId:  c.ParentID,
		UserId:    c.UserID,
		Username:  c.Username,
		Content:   c.Content,
		CreatedAt: timestamppb.New(c.CreatedAt),
		Children:  children,
	}
}
