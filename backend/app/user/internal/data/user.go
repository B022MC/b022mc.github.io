package data

import (
	"context"
	"database/sql"
	"time"

	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/biz"
)

type User struct {
	ID           int64
	Username     string
	Email        string
	Avatar       string
	PasswordHash string
	CreatedAt    time.Time
}

type userRepo struct {
	data *Data
}

func NewUserRepo(data *Data) biz.UserRepo {
	return &userRepo{data: data}
}

func (r *userRepo) Create(ctx context.Context, username, email, passwordHash string) (*biz.User, error) {
	result, err := r.data.db.ExecContext(ctx,
		`INSERT INTO users (username, email, avatar, password_hash, created_at)
		 VALUES (?, ?, '', ?, NOW())`,
		username, email, passwordHash)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *userRepo) GetByUsername(ctx context.Context, username string) (*biz.User, error) {
	var u User
	err := r.data.db.QueryRowContext(ctx,
		`SELECT id, username, email, avatar, password_hash, created_at
		 FROM users WHERE username=?`,
		username).Scan(&u.ID, &u.Username, &u.Email, &u.Avatar, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return toBizUser(&u), nil
}

func (r *userRepo) GetByID(ctx context.Context, id int64) (*biz.User, error) {
	var u User
	err := r.data.db.QueryRowContext(ctx,
		`SELECT id, username, email, avatar, password_hash, created_at
		 FROM users WHERE id=?`,
		id).Scan(&u.ID, &u.Username, &u.Email, &u.Avatar, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return toBizUser(&u), nil
}

func toBizUser(u *User) *biz.User {
	if u == nil {
		return nil
	}
	return &biz.User{
		ID:           u.ID,
		Username:     u.Username,
		Email:        u.Email,
		Avatar:       u.Avatar,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
	}
}
