package data

import (
	"context"
	"time"

	"github.com/b022mc/b022mc.github.io/backend/app/comment/internal/biz"
)

type Comment struct {
	ID        int64
	ArticleID int64
	ParentID  int64
	UserID    int64
	Username  string
	Content   string
	CreatedAt time.Time
}

type commentRepo struct {
	data *Data
}

func NewCommentRepo(data *Data) biz.CommentRepo {
	return &commentRepo{data: data}
}

func (r *commentRepo) Create(ctx context.Context, articleID, parentID, userID int64, content string) (*biz.Comment, error) {
	var username string
	_ = r.data.db.QueryRowContext(ctx, `SELECT username FROM users WHERE id = ?`, userID).Scan(&username)

	result, err := r.data.db.ExecContext(ctx,
		`INSERT INTO comments (article_id, parent_id, user_id, username, content, created_at)
		 VALUES (?, ?, ?, ?, ?, NOW())`,
		articleID, parentID, userID, username, content)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &biz.Comment{
		ID:        id,
		ArticleID: articleID,
		ParentID:  parentID,
		UserID:    userID,
		Username:  username,
		Content:   content,
		CreatedAt: time.Now(),
		Children:  nil,
	}, nil
}

func (r *commentRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.data.db.ExecContext(ctx, `DELETE FROM comments WHERE id = ?`, id)
	return err
}

func (r *commentRepo) ListByArticle(ctx context.Context, articleID int64) ([]*biz.Comment, error) {
	rows, err := r.data.db.QueryContext(ctx,
		`SELECT id, article_id, parent_id, user_id, username, content, created_at
		 FROM comments WHERE article_id = ?
		 ORDER BY created_at ASC`,
		articleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*biz.Comment
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.ArticleID, &c.ParentID, &c.UserID, &c.Username, &c.Content, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &biz.Comment{
			ID:        c.ID,
			ArticleID: c.ArticleID,
			ParentID:  c.ParentID,
			UserID:    c.UserID,
			Username:  c.Username,
			Content:   c.Content,
			CreatedAt: c.CreatedAt,
			Children:  nil,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}
