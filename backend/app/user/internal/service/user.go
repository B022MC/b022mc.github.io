package service

import (
	"context"

	"github.com/go-kratos/kratos/v2/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	v1 "github.com/b022mc/b022mc.github.io/backend/api/blog/v1"
	"github.com/b022mc/b022mc.github.io/backend/app/user/internal/biz"
)

type UserService struct {
	v1.UnimplementedUserServiceServer

	uc  *biz.UserUsecase
	log *log.Helper
}

func NewUserService(uc *biz.UserUsecase, logger log.Logger) *UserService {
	return &UserService{uc: uc, log: log.NewHelper(logger)}
}

func (s *UserService) Register(ctx context.Context, req *v1.RegisterRequest) (*v1.AuthReply, error) {
	token, user, err := s.uc.Register(ctx, req.GetUsername(), req.GetEmail(), req.GetPassword())
	if err != nil {
		if err == biz.ErrUserExists {
			return nil, status.Errorf(codes.AlreadyExists, "user already exists: %s", req.GetUsername())
		}
		return nil, status.Errorf(codes.Internal, "register: %v", err)
	}
	return &v1.AuthReply{Token: token, User: toProtoUser(user)}, nil
}

func (s *UserService) Login(ctx context.Context, req *v1.LoginRequest) (*v1.AuthReply, error) {
	token, user, err := s.uc.Login(ctx, req.GetUsername(), req.GetPassword())
	if err != nil {
		if err == biz.ErrUserNotFound || err == biz.ErrInvalidPass {
			return nil, status.Errorf(codes.Unauthenticated, "invalid username or password")
		}
		return nil, status.Errorf(codes.Internal, "login: %v", err)
	}
	return &v1.AuthReply{Token: token, User: toProtoUser(user)}, nil
}

func (s *UserService) GetUser(ctx context.Context, req *v1.GetUserRequest) (*v1.UserReply, error) {
	user, err := s.uc.GetUser(ctx, req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get user: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}
	return &v1.UserReply{User: toProtoUser(user)}, nil
}

func (s *UserService) VerifyToken(ctx context.Context, req *v1.VerifyTokenRequest) (*v1.UserReply, error) {
	user, err := s.uc.VerifyToken(ctx, req.GetToken())
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "verify token: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}
	return &v1.UserReply{User: toProtoUser(user)}, nil
}

func toProtoUser(u *biz.User) *v1.User {
	if u == nil {
		return nil
	}
	return &v1.User{
		Id:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		Avatar:    u.Avatar,
		CreatedAt: timestamppb.New(u.CreatedAt),
	}
}
