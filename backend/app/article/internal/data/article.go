package data

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/b022mc/b022mc.github.io/backend/app/article/internal/biz"
)

type Article struct {
	ID         int64
	Slug       string
	Title      string
	Summary    string
	Content    string
	CoverImage string
	Tags       string // comma-separated in DB
	ViewCount  int64
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type articleRepo struct {
	data *Data
}

func NewArticleRepo(data *Data) biz.ArticleRepo {
	return &articleRepo{data: data}
}

func generateSlug(title string) string {
	// Simple slug: lowercase, replace spaces with hyphens
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("article-%d", time.Now().Unix())
	}
	return slug
}

func (r *articleRepo) CreateArticle(ctx context.Context, article *biz.Article) (*biz.Article, error) {
	slug := generateSlug(article.Title)
	tags := strings.Join(article.Tags, ",")
	result, err := r.data.db.ExecContext(ctx,
		`INSERT INTO articles (slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
		slug, article.Title, article.Summary, article.Content, article.CoverImage, tags)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	article.ID = id
	article.Slug = slug
	article.ViewCount = 0
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()
	return article, nil
}

func (r *articleRepo) UpdateArticle(ctx context.Context, article *biz.Article) error {
	tags := strings.Join(article.Tags, ",")
	_, err := r.data.db.ExecContext(ctx,
		`UPDATE articles SET title=?, summary=?, content=?, cover_image=?, tags=?, updated_at=NOW()
		 WHERE id=?`,
		article.Title, article.Summary, article.Content, article.CoverImage, tags, article.ID)
	if err != nil {
		return err
	}
	// Invalidate cache
	r.data.redis.Del(ctx, articleCacheKey(article.ID))
	var slug string
	if r.data.db.QueryRowContext(ctx, `SELECT slug FROM articles WHERE id=?`, article.ID).Scan(&slug) == nil {
		r.data.redis.Del(ctx, articleSlugCacheKey(slug))
	}
	return nil
}

func (r *articleRepo) DeleteArticle(ctx context.Context, id int64) error {
	var slug string
	_ = r.data.db.QueryRowContext(ctx, `SELECT slug FROM articles WHERE id=?`, id).Scan(&slug)
	_, err := r.data.db.ExecContext(ctx, `DELETE FROM articles WHERE id=?`, id)
	if err == nil {
		r.data.redis.Del(ctx, articleCacheKey(id))
		if slug != "" {
			r.data.redis.Del(ctx, articleSlugCacheKey(slug))
		}
	}
	return err
}

func articleCacheKey(id int64) string {
	return fmt.Sprintf("article:%d", id)
}

func articleSlugCacheKey(slug string) string {
	return fmt.Sprintf("article:slug:%s", slug)
}

func (r *articleRepo) GetBySlug(ctx context.Context, slug string) (*biz.Article, error) {
	// Try cache by slug first (we need to resolve slug -> id for cache invalidation)
	cacheKey := articleSlugCacheKey(slug)
	cached, err := r.data.redis.Get(ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var a biz.Article
		if json.Unmarshal([]byte(cached), &a) == nil {
			return &a, nil
		}
	}

	var art Article
	err = r.data.db.QueryRowContext(ctx,
		`SELECT id, slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at
		 FROM articles WHERE slug=?`,
		slug).Scan(&art.ID, &art.Slug, &art.Title, &art.Summary, &art.Content, &art.CoverImage,
		&art.Tags, &art.ViewCount, &art.CreatedAt, &art.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Increment view count
	_, _ = r.data.db.ExecContext(ctx, `UPDATE articles SET view_count=view_count+1 WHERE id=?`, art.ID)
	art.ViewCount++

	bizArt := toBizArticle(&art)

	// Cache for 5 minutes
	if data, err := json.Marshal(bizArt); err == nil {
		r.data.redis.Set(ctx, cacheKey, string(data), 5*time.Minute)
		r.data.redis.Set(ctx, articleCacheKey(art.ID), string(data), 5*time.Minute)
	}
	return bizArt, nil
}

func (r *articleRepo) GetByID(ctx context.Context, id int64) (*biz.Article, error) {
	// Try cache first
	cacheKey := articleCacheKey(id)
	cached, err := r.data.redis.Get(ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var a biz.Article
		if json.Unmarshal([]byte(cached), &a) == nil {
			return &a, nil
		}
	}

	var art Article
	err = r.data.db.QueryRowContext(ctx,
		`SELECT id, slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at
		 FROM articles WHERE id=?`,
		id).Scan(&art.ID, &art.Slug, &art.Title, &art.Summary, &art.Content, &art.CoverImage,
		&art.Tags, &art.ViewCount, &art.CreatedAt, &art.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	bizArt := toBizArticle(&art)
	// Cache for 5 minutes
	if data, err := json.Marshal(bizArt); err == nil {
		r.data.redis.Set(ctx, cacheKey, string(data), 5*time.Minute)
		r.data.redis.Set(ctx, articleSlugCacheKey(art.Slug), string(data), 5*time.Minute)
	}
	return bizArt, nil
}

func (r *articleRepo) List(ctx context.Context, page, pageSize int32, tag string) ([]*biz.Article, int64, error) {
	var total int64
	var countQuery, listQuery string

	if tag != "" {
		countQuery = `SELECT COUNT(*) FROM articles WHERE FIND_IN_SET(?, tags) > 0`
		listQuery = `SELECT id, slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at
			FROM articles WHERE FIND_IN_SET(?, tags) > 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`
	} else {
		countQuery = `SELECT COUNT(*) FROM articles`
		listQuery = `SELECT id, slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at
			FROM articles ORDER BY created_at DESC LIMIT ? OFFSET ?`
	}

	if tag != "" {
		_ = r.data.db.QueryRowContext(ctx, countQuery, tag).Scan(&total)
	} else {
		_ = r.data.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}

	var listArgs []interface{}
	if tag != "" {
		listArgs = []interface{}{tag, pageSize, (page - 1) * pageSize}
	} else {
		listArgs = []interface{}{pageSize, (page - 1) * pageSize}
	}
	rows, err := r.data.db.QueryContext(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*biz.Article
	for rows.Next() {
		var art Article
		if err := rows.Scan(&art.ID, &art.Slug, &art.Title, &art.Summary, &art.Content, &art.CoverImage,
			&art.Tags, &art.ViewCount, &art.CreatedAt, &art.UpdatedAt); err != nil {
			return nil, 0, err
		}
		list = append(list, toBizArticle(&art))
	}
	return list, total, nil
}

func (r *articleRepo) Search(ctx context.Context, query string, page, pageSize int32) ([]*biz.Article, int64, error) {
	likeQuery := "%" + query + "%"
	var total int64
	err := r.data.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM articles WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?`,
		likeQuery, likeQuery, likeQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.data.db.QueryContext(ctx,
		`SELECT id, slug, title, summary, content, cover_image, tags, view_count, created_at, updated_at
		 FROM articles WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
		 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		likeQuery, likeQuery, likeQuery, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*biz.Article
	for rows.Next() {
		var art Article
		if err := rows.Scan(&art.ID, &art.Slug, &art.Title, &art.Summary, &art.Content, &art.CoverImage,
			&art.Tags, &art.ViewCount, &art.CreatedAt, &art.UpdatedAt); err != nil {
			return nil, 0, err
		}
		list = append(list, toBizArticle(&art))
	}
	return list, total, nil
}

func (r *articleRepo) ListTags(ctx context.Context) ([]string, error) {
	rows, err := r.data.db.QueryContext(ctx, `SELECT DISTINCT tags FROM articles WHERE tags != ''`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tagSet := make(map[string]bool)
	for rows.Next() {
		var tags string
		if err := rows.Scan(&tags); err != nil {
			continue
		}
		for _, t := range strings.Split(tags, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				tagSet[t] = true
			}
		}
	}
	var result []string
	for t := range tagSet {
		result = append(result, t)
	}
	return result, nil
}

func toBizArticle(art *Article) *biz.Article {
	var tags []string
	if art.Tags != "" {
		for _, t := range strings.Split(art.Tags, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				tags = append(tags, t)
			}
		}
	}
	return &biz.Article{
		ID:         art.ID,
		Slug:       art.Slug,
		Title:      art.Title,
		Summary:    art.Summary,
		Content:    art.Content,
		CoverImage: art.CoverImage,
		Tags:       tags,
		ViewCount:  art.ViewCount,
		CreatedAt:  art.CreatedAt,
		UpdatedAt:  art.UpdatedAt,
	}
}
