# Production Configuration Matrix

This matrix records where the blog production configuration currently comes
from, who is expected to change it, and which runtime path it affects.

## Configuration Matrix

| Item | Source of truth | Current value entry | Change owner | Effect path | Verify with |
| --- | --- | --- | --- | --- | --- |
| Public DNS for `b022mc.cn` | External DNS provider | DNS console entry for apex record | Infra / domain owner | Public traffic into the primary domain | `dig b022mc.cn` |
| Public DNS for `www.b022mc.cn` | External DNS provider | DNS console entry for `www` record | Infra / domain owner | Public traffic into the `www` domain | `dig www.b022mc.cn` |
| TLS certificate for public domains | External certificate issuer plus reverse proxy host | Certificate files or ACME state on the public entry host | Infra / domain owner | HTTPS handshake and redirect behavior | `curl -I https://b022mc.cn` |
| Reverse proxy upstream routing | Public entry host configuration | Reverse proxy config on the Tencent Cloud host | Infra / host owner | Host-level forwarding from public traffic to K3s ingress or node ports | host config review + `curl -I` |
| Frontend canonical site URL | Frontend runtime env | `SITE_URL` or `NEXT_PUBLIC_SITE_URL` in runtime env; fallback in `frontend/src/app/layout.tsx` | Frontend / deployment owner | Metadata base, canonical URL, feed URL generation | page source + route checks |
| Frontend browser API base | Frontend runtime env | `NEXT_PUBLIC_API_URL` in browser runtime env; fallback logic in `frontend/src/lib/api.ts` | Frontend / deployment owner | Browser-side API requests under same-origin or explicit API base | browser network panel |
| Frontend server API base | Frontend server runtime env | `API_BASE_URL` or `NEXT_PUBLIC_API_URL` consumed by server-side requests | Frontend / deployment owner | Server-side fetches, RSS generation, pre-rendered data calls | app route checks |
| Blog API HTTP bind address | Backend service config | `backend/app/blog-api/configs/config.yaml` and the deployed ConfigMap in `backend/deploy/k8s/services/backend/blog-api.yaml` | Backend / platform owner | HTTP listener for `blog-api` service | pod config review + `kubectl describe` |
| Internal gRPC service discovery | Backend service config | Blog API config entries for article, user, and comment service addresses | Backend / platform owner | Service-to-service calls inside the cluster | config review + in-cluster request |
| JWT secret | Kubernetes secret or backend config fallback | `blog-secrets` secret key `jwt-secret`; local config fallback in backend config | Backend / platform owner | Auth token verification across login, admin, and comment write flows | auth request + pod env review |
| Database and Redis credentials | Kubernetes secret | `blog-secrets` secret keys for MySQL and Redis credentials | Backend / platform owner | Middleware startup and service data access | pod startup logs + connection checks |
| Ingress host and path routing | Kubernetes manifests | `backend/deploy/k8s/services/frontend/ingress.yaml` | Platform owner | Cluster routing for `/` and `/api` on both domains | `kubectl get ingress blog-web -o yaml` |
| CI deployment secrets | GitHub Actions secrets | `K3S_HOST`, `K3S_PASSWORD`, and the built-in `GITHUB_TOKEN` in workflow runtime | Repo admin / platform owner | Build, registry login, and remote deploy over SSH | workflow run logs |
| Container registry coordinates | GitHub Actions env | `REGISTRY` and `REPO_OWNER` in `.github/workflows/ci.yaml` | Repo admin | Image tags pushed to GHCR and later deployed | workflow logs + image tags |

## Ownership Notes

- Infra / domain owner: controls DNS, certificate issuance, and host-level reverse proxy.
- Platform owner: controls K3s manifests, cluster secrets, ingress, and rollout behavior.
- Frontend owner: controls runtime env usage and how frontend code consumes site or API URLs.
- Backend owner: controls service config, secret consumption, and auth/data dependencies.

## Sensitive Material Handling

- Secret names may be referenced in repository docs, but secret values must stay out of
  issue notes, commits, and review summaries.
- If a sensitive value appears in tracked manifests, treat that as a follow-up security
  concern rather than repeating it in new documentation.

## Validation Notes

- This matrix is repository-grounded first: it documents code and manifest entry points.
- External systems such as DNS consoles, ACME state, and host proxy config still require
  live verification before claiming production parity.
