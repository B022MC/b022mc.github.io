package biz

import (
	"context"
	"time"
)

type Comment struct {
	ID        int64
	ArticleID int64
	ParentID  int64
	UserID    int64
	Username  string
	Content   string
	CreatedAt time.Time
	Children  []*Comment
}

type CommentRepo interface {
	Create(ctx context.Context, articleID, parentID, userID int64, content string) (*Comment, error)
	Delete(ctx context.Context, id int64) error
	ListByArticle(ctx context.Context, articleID int64) ([]*Comment, error)
}

type CommentUsecase struct {
	repo CommentRepo
}

func NewCommentUsecase(repo CommentRepo) *CommentUsecase {
	return &CommentUsecase{repo: repo}
}

func (uc *CommentUsecase) CreateComment(ctx context.Context, articleID, parentID, userID int64, content string) (*Comment, error) {
	return uc.repo.Create(ctx, articleID, parentID, userID, content)
}

func (uc *CommentUsecase) DeleteComment(ctx context.Context, id int64) error {
	return uc.repo.Delete(ctx, id)
}

func (uc *CommentUsecase) ListComments(ctx context.Context, articleID int64) ([]*Comment, error) {
	flat, err := uc.repo.ListByArticle(ctx, articleID)
	if err != nil {
		return nil, err
	}
	return buildTree(flat), nil
}

// buildTree converts a flat list of comments into a tree structure based on ParentID.
// Root comments (ParentID == 0) are top-level; others are nested under their parent.
// Order is preserved from the flat list (by created_at).
func buildTree(flat []*Comment) []*Comment {
	if len(flat) == 0 {
		return nil
	}
	byID := make(map[int64]*Comment)
	for _, c := range flat {
		cp := &Comment{
			ID:        c.ID,
			ArticleID: c.ArticleID,
			ParentID:  c.ParentID,
			UserID:    c.UserID,
			Username:  c.Username,
			Content:   c.Content,
			CreatedAt: c.CreatedAt,
			Children:  nil,
		}
		byID[c.ID] = cp
	}
	var roots []*Comment
	for _, c := range flat {
		cp := byID[c.ID]
		if cp.ParentID == 0 {
			roots = append(roots, cp)
		} else if p, ok := byID[cp.ParentID]; ok {
			p.Children = append(p.Children, cp)
		} else {
			roots = append(roots, cp)
		}
	}
	return roots
}
