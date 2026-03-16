# Multi-stage Dockerfile for Blog Backend Services
# Usage:
#   docker build --target blog-api  -t blog-api .
#   docker build --target article   -t blog-article .
#   docker build --target user      -t blog-user .
#   docker build --target comment   -t blog-comment .

# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /src
COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.cn,direct
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/blog-api  ./app/blog-api/cmd/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/article   ./app/article/cmd/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/user      ./app/user/cmd/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/comment   ./app/comment/cmd/

# ---- Runtime: Blog API Gateway ----
FROM alpine:3.20 AS blog-api
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/blog-api /app/blog-api
COPY app/blog-api/configs /app/configs
WORKDIR /app
EXPOSE 8080
CMD ["./blog-api", "-conf", "configs"]

# ---- Runtime: Article Service ----
FROM alpine:3.20 AS article
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/article /app/article
COPY app/article/configs /app/configs
WORKDIR /app
EXPOSE 9001
CMD ["./article", "-conf", "configs"]

# ---- Runtime: User Service ----
FROM alpine:3.20 AS user
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/user /app/user
COPY app/user/configs /app/configs
WORKDIR /app
EXPOSE 9002
CMD ["./user", "-conf", "configs"]

# ---- Runtime: Comment Service ----
FROM alpine:3.20 AS comment
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/comment /app/comment
COPY app/comment/configs /app/configs
WORKDIR /app
EXPOSE 9003
CMD ["./comment", "-conf", "configs"]
