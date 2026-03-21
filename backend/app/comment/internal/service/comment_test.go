package service

import (
	"context"
	"io"
	"testing"
	"time"

	"github.com/go-kratos/kratos/v2/log"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/biz"
)

type commentRepoStub struct {
	createFn func(context.Context, int64, int64, int64, string) (*biz.Comment, error)
	deleteFn func(context.Context, int64) error
	listFn   func(context.Context, int64) ([]*biz.Comment, error)
}

func (s commentRepoStub) Create(ctx context.Context, articleID, parentID, userID int64, content string) (*biz.Comment, error) {
	return s.createFn(ctx, articleID, parentID, userID, content)
}

func (s commentRepoStub) Delete(ctx context.Context, id int64) error {
	return s.deleteFn(ctx, id)
}

func (s commentRepoStub) ListByArticle(ctx context.Context, articleID int64) ([]*biz.Comment, error) {
	return s.listFn(ctx, articleID)
}

func newCommentServiceForTest(repo commentRepoStub) *CommentService {
	return NewCommentService(biz.NewCommentUsecase(repo), log.NewStdLogger(io.Discard))
}

func TestCommentServiceCreateComment(t *testing.T) {
	var received struct {
		articleID int64
		parentID  int64
		userID    int64
		content   string
	}
	timestamp := time.Date(2026, 3, 21, 12, 0, 0, 0, time.UTC)
	svc := newCommentServiceForTest(commentRepoStub{
		createFn: func(_ context.Context, articleID, parentID, userID int64, content string) (*biz.Comment, error) {
			received.articleID = articleID
			received.parentID = parentID
			received.userID = userID
			received.content = content
			return &biz.Comment{
				ID:        9,
				ArticleID: articleID,
				ParentID:  parentID,
				UserID:    userID,
				Username:  "alice",
				Content:   content,
				CreatedAt: timestamp,
			}, nil
		},
		deleteFn: func(context.Context, int64) error { return nil },
		listFn:   func(context.Context, int64) ([]*biz.Comment, error) { return nil, nil },
	})

	reply, err := svc.CreateComment(context.Background(), &v1.CreateCommentRequest{
		ArticleId: 7,
		ParentId:  3,
		UserId:    11,
		Content:   "hello",
	})
	if err != nil {
		t.Fatalf("CreateComment returned error: %v", err)
	}

	if received.articleID != 7 || received.parentID != 3 || received.userID != 11 || received.content != "hello" {
		t.Fatalf("unexpected create arguments: %#v", received)
	}
	if reply.GetComment().GetUsername() != "alice" {
		t.Fatalf("unexpected username: %s", reply.GetComment().GetUsername())
	}
}

func TestCommentServiceListCommentsBuildsTree(t *testing.T) {
	timestamp := time.Date(2026, 3, 21, 12, 0, 0, 0, time.UTC)
	svc := newCommentServiceForTest(commentRepoStub{
		createFn: func(context.Context, int64, int64, int64, string) (*biz.Comment, error) { return nil, nil },
		deleteFn: func(context.Context, int64) error { return nil },
		listFn: func(context.Context, int64) ([]*biz.Comment, error) {
			return []*biz.Comment{
				{ID: 1, ArticleID: 7, ParentID: 0, UserID: 1, Username: "root", Content: "first", CreatedAt: timestamp},
				{ID: 2, ArticleID: 7, ParentID: 1, UserID: 2, Username: "child", Content: "reply", CreatedAt: timestamp},
			}, nil
		},
	})

	reply, err := svc.ListComments(context.Background(), &v1.ListCommentsRequest{ArticleId: 7})
	if err != nil {
		t.Fatalf("ListComments returned error: %v", err)
	}

	if len(reply.GetComments()) != 1 {
		t.Fatalf("expected one root comment, got %d", len(reply.GetComments()))
	}
	if len(reply.GetComments()[0].GetChildren()) != 1 {
		t.Fatalf("expected nested reply, got %#v", reply.GetComments()[0].GetChildren())
	}
}
