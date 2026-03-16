package biz

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/conf"
)

var (
	ErrUserExists   = errors.New("user already exists")
	ErrUserNotFound = errors.New("user not found")
	ErrInvalidPass  = errors.New("invalid password")
)

type User struct {
	ID           int64
	Username     string
	Email        string
	Avatar       string
	PasswordHash string
	CreatedAt    time.Time
}

type UserRepo interface {
	Create(ctx context.Context, username, email, passwordHash string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByID(ctx context.Context, id int64) (*User, error)
}

type UserUsecase struct {
	repo   UserRepo
	config *conf.Config
}

func NewUserUsecase(repo UserRepo, c *conf.Config) *UserUsecase {
	return &UserUsecase{repo: repo, config: c}
}

const salt = "blog-user-salt-2026"

func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password + salt))
	return hex.EncodeToString(h.Sum(nil))
}

func (uc *UserUsecase) Register(ctx context.Context, username, email, password string) (string, *User, error) {
	exist, err := uc.repo.GetByUsername(ctx, username)
	if err != nil {
		return "", nil, err
	}
	if exist != nil {
		return "", nil, ErrUserExists
	}
	passwordHash := hashPassword(password)
	user, err := uc.repo.Create(ctx, username, email, passwordHash)
	if err != nil {
		return "", nil, err
	}
	token, err := uc.generateJWT(user.ID, user.Username)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

func (uc *UserUsecase) Login(ctx context.Context, username, password string) (string, *User, error) {
	user, err := uc.repo.GetByUsername(ctx, username)
	if err != nil {
		return "", nil, err
	}
	if user == nil {
		return "", nil, ErrUserNotFound
	}
	passwordHash := hashPassword(password)
	if passwordHash != user.PasswordHash {
		return "", nil, ErrInvalidPass
	}
	token, err := uc.generateJWT(user.ID, user.Username)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

func (uc *UserUsecase) GetUser(ctx context.Context, id int64) (*User, error) {
	return uc.repo.GetByID(ctx, id)
}

type claims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func (uc *UserUsecase) generateJWT(userID int64, username string) (string, error) {
	expire := uc.config.Auth.Expire
	if expire <= 0 {
		expire = 259200 // 3 days default
	}
	c := claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expire) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return token.SignedString([]byte(uc.config.Auth.Secret))
}

func (uc *UserUsecase) VerifyToken(ctx context.Context, tokenStr string) (*User, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(uc.config.Auth.Secret), nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := token.Claims.(*claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return uc.repo.GetByID(ctx, c.UserID)
}
