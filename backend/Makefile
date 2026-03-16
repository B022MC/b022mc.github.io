.PHONY: proto build test clean run

GOPATH := $(shell go env GOPATH)
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")

proto:
	protoc --proto_path=./api \
		--proto_path=$(GOPATH)/src \
		--go_out=paths=source_relative:./api \
		--go-grpc_out=paths=source_relative:./api \
		./api/blog/v1/*.proto

build:
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ./bin/blog-api ./app/blog-api/cmd/
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ./bin/article ./app/article/cmd/
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ./bin/user ./app/user/cmd/
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ./bin/comment ./app/comment/cmd/

test:
	go test ./...

clean:
	rm -rf ./bin

run-api:
	go run ./app/blog-api/cmd/ -conf ./app/blog-api/configs/

run-article:
	go run ./app/article/cmd/ -conf ./app/article/configs/

run-user:
	go run ./app/user/cmd/ -conf ./app/user/configs/

run-comment:
	go run ./app/comment/cmd/ -conf ./app/comment/configs/
