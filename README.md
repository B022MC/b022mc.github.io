# b022mc.github.io

Personal blog built with Next.js 16 + Tailwind 4 + shadcn + Framer Motion (frontend) and Go Kratos v2 (backend).

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- shadcn/ui
- Framer Motion (animations)
- next-themes (dark mode)

### Backend
- Go 1.24
- Kratos v2 (microservice framework)
- gRPC + Protobuf
- MySQL 8.0
- Redis 7
- JWT authentication

## Project Structure

```
├── frontend/          # Next.js frontend
├── backend/           # Go Kratos backend
│   ├── api/           # Protobuf definitions
│   ├── app/           # Microservices
│   │   ├── blog-api/  # HTTP BFF gateway (:8080)
│   │   ├── article/   # Article service (gRPC :9001)
│   │   ├── user/      # User service (gRPC :9002)
│   │   └── comment/   # Comment service (gRPC :9003)
│   └── deploy/k8s/    # Kubernetes manifests
└── .github/workflows/ # CI/CD pipeline
```

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go mod download
make run
```

## Deployment

Deployed via GitHub Actions to K3s cluster. Docker images pushed to `ghcr.io/b022mc/blog-*`.

## Operations

- Runbook: `docs/blog-operations-runbook.md`
- Acceptance baseline: `docs/project-acceptance-baseline.md`
- Production config matrix: `docs/production-config-matrix.md`
- Public access diagnostics: `docs/public-access-diagnostics.md`
