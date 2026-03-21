# Blog Operations Runbook

This runbook is the long-term operations entry point for the blog repository.
Use it together with the focused diagnostics documents that already exist in
`docs/`.

## Source Documents

- Acceptance boundary: `docs/project-acceptance-baseline.md`
- Production config ownership: `docs/production-config-matrix.md`
- Public access diagnostics: `docs/public-access-diagnostics.md`
- Host reverse proxy findings: `docs/host-reverse-proxy-status.md`
- CI/CD pipeline: `.github/workflows/ci.yaml`

## Current Known Production Blockers

As of 2026-03-21, these items still require live-environment follow-up:

- `b022mc.cn` apex DNS / HTTPS is not fully verified end to end.
- `blog-api` currently returns `500` on article listing because the backing
  schema is incomplete (`Table 'blog.articles' doesn't exist` observed on the
  host).
- CI rollback automation is still manual; use the rollback section below until
  `BLOG-180` lands.

## Day-To-Day Content Publishing

1. Create or edit content from `/admin` and `/admin/edit`.
2. Run the frontend safety checks before merging:
   - `cd frontend`
   - `npm run test`
   - `npm run lint`
   - `npm run build`
3. If backend behavior changed, also run:
   - `cd backend`
   - `go test ./...`
4. Merge to `main` only after the local checks above pass.

## Deployment Flow

Deployments are triggered from `.github/workflows/ci.yaml` on push to `main`.

### Quality Gates

- Backend: `go test ./...`
- Frontend: `npm ci`, `npm run lint`, `npm run test`, `npm run build`

### Build Outputs

- Backend images:
  - `ghcr.io/b022mc/blog-api:<sha>`
  - `ghcr.io/b022mc/blog-article:<sha>`
  - `ghcr.io/b022mc/blog-user:<sha>`
  - `ghcr.io/b022mc/blog-comment:<sha>`
- Frontend image:
  - `ghcr.io/b022mc/blog-frontend:<sha>`

### Deploy Targets

- Namespace: `blog`
- Primary host: `119.27.191.212`
- Host reverse proxy: Caddy on ports `80/443`
- K3s NodePorts:
  - frontend: `30180`
  - blog-api: `30800`

## Post-Deploy Verification

Run these checks in order:

1. Public diagnostics:
   - `bash scripts/check-public-chain.sh`
   - Optional host-specific run:
     - `NODE_HOST=119.27.191.212 FRONTEND_NODE_PORT=30180 BLOG_API_NODE_PORT=30800 bash scripts/check-public-chain.sh`
2. Host-local health checks on `119.27.191.212`:
   - `curl -fsS http://127.0.0.1:30180/healthz`
   - `curl -fsS http://127.0.0.1:30800/api/healthz`
3. Public page checks:
   - `curl -I https://www.b022mc.cn/`
   - `curl -I https://www.b022mc.cn/api/v1/articles`
   - `curl -I https://b022mc.cn/`
4. Metadata and asset checks:
   - `curl -fsS https://www.b022mc.cn/robots.txt`
   - `curl -fsS https://www.b022mc.cn/sitemap.xml`
   - `curl -fsS https://www.b022mc.cn/feed.xml`

If any step fails, stop and move to the troubleshooting section instead of
continuing rollout validation blindly.

## DNS And Certificate Checks

Use this checklist whenever domain or HTTPS behavior changes:

1. Verify DNS:
   - `dig +short b022mc.cn`
   - `dig +short www.b022mc.cn`
2. Verify Caddy config on host:
   - `sed -n '1,240p' /opt/caddy/Caddyfile`
3. Verify certificate storage:
   - `find /opt/caddy/data/caddy -maxdepth 5 -type f | grep b022mc.cn`
4. Verify public HTTPS:
   - `curl -vkI https://b022mc.cn/`
   - `curl -vkI https://www.b022mc.cn/`

If `www` works but apex does not, treat that as a DNS or certificate issuance
problem, not an upstream routing problem.

## Troubleshooting Guide

### Public Domain Fails

1. Run `bash scripts/check-public-chain.sh`.
2. Compare DNS results for apex and `www`.
3. If host-local NodePorts succeed but public HTTPS fails, inspect Caddy and DNS.

### Frontend Works But `/api` Fails

1. Check host-local blog-api:
   - `curl -sv http://127.0.0.1:30800/api/v1/articles`
2. Check K3s services:
   - `k3s kubectl -n blog get svc frontend blog-api -o wide`
3. Inspect blog-api and article logs:
   - `k3s kubectl -n blog logs deploy/blog-api --tail=200`
   - `k3s kubectl -n blog logs deploy/article --tail=200`

### Rollout Stalls

1. Inspect deployment rollout:
   - `k3s kubectl -n blog rollout status deployment/<name> --timeout=15m`
2. Download the GitHub Actions artifact named `deploy-diagnostics-<sha>` from
   the deploy workflow run and review the rollout, pod, and smoke outputs first.
3. If you still need host access, collect deployment and pod diagnostics:
   - `k3s kubectl -n blog describe deployment <name>`
   - `k3s kubectl -n blog get pods -l app=<name> -o wide`
   - `k3s kubectl -n blog logs deploy/<name> --all-containers=true --tail=200`

### Health Checks Fail

1. Re-run:
   - `curl -fsS http://127.0.0.1:30180/healthz`
   - `curl -fsS http://127.0.0.1:30800/api/healthz`
2. If one health check fails, inspect only that service first instead of rolling
   back the whole stack immediately.

## Manual Rollback

Until automated rollback is implemented, rollback is manual:

1. Identify the last known good image SHA from the deploy workflow summary,
   the `deploy-diagnostics-<sha>` artifact, or GHCR.
2. Reset the deployments explicitly:

```bash
k3s kubectl -n blog set image deployment/blog-api blog-api=ghcr.io/b022mc/blog-api:<good-sha>
k3s kubectl -n blog set image deployment/article article=ghcr.io/b022mc/blog-article:<good-sha>
k3s kubectl -n blog set image deployment/user user=ghcr.io/b022mc/blog-user:<good-sha>
k3s kubectl -n blog set image deployment/comment comment=ghcr.io/b022mc/blog-comment:<good-sha>
k3s kubectl -n blog set image deployment/frontend frontend=ghcr.io/b022mc/blog-frontend:<good-sha>
```

3. Wait for rollout:

```bash
k3s kubectl -n blog rollout status deployment/blog-api --timeout=15m
k3s kubectl -n blog rollout status deployment/article --timeout=15m
k3s kubectl -n blog rollout status deployment/user --timeout=15m
k3s kubectl -n blog rollout status deployment/comment --timeout=15m
k3s kubectl -n blog rollout status deployment/frontend --timeout=15m
```

4. Re-run the post-deploy verification checklist.

If only one service regressed, prefer rolling back that service first and
re-checking health instead of reverting every deployment immediately.

## Dependency Upgrade Rhythm

- Frontend dependencies: review monthly or before major Next.js / React upgrades.
- Backend Go modules: review monthly with `go list -m -u all` or when security
  advisories land.
- Infrastructure manifests and CI actions: review quarterly and after any K3s or
  GitHub Actions platform change.

For every dependency change, rerun the same quality gates used for deployment.

## Publishing And Operations Ownership

- Frontend owner: page behavior, metadata, admin UI, frontend tests.
- Backend owner: service behavior, schema migration, auth, backend tests.
- Platform owner: K3s manifests, Caddy, DNS, TLS, deployment reliability.

If a change crosses more than one area, update the related docs together rather
than leaving operational knowledge split across code review comments.
