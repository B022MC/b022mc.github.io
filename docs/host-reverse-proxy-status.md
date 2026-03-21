# Host Reverse Proxy Status

Verified on `119.27.191.212` (`k3s_master`) via SSH Manager on 2026-03-21.

## Live Host Findings

- Caddy is running on ports `80` and `443`.
- The active Caddyfile lives at `/opt/caddy/Caddyfile`.
- The live route mapping is:
  - `/api*` -> `127.0.0.1:30800`
  - all other paths -> `127.0.0.1:30180`
- K3s exposes matching NodePorts:
  - `frontend` -> `3000:30180`
  - `blog-api` -> `8080:30800`

## Verified Caddy Mapping

```caddyfile
{
  email b022mc@163.com
}

b022mc.cn, www.b022mc.cn {
  @api path /api*
  reverse_proxy @api 127.0.0.1:30800
  reverse_proxy 127.0.0.1:30180
}
```

## Host-Local Validation

Commands run on the host:

```bash
curl -sv http://127.0.0.1:30180/
curl -sv http://127.0.0.1:30800/api/v1/articles
curl -skv --resolve www.b022mc.cn:443:127.0.0.1 https://www.b022mc.cn/
curl -skv --resolve www.b022mc.cn:443:127.0.0.1 https://www.b022mc.cn/api/v1/articles
```

Observed results:

- `127.0.0.1:30180/` returns `200 OK` from Next.js.
- `127.0.0.1:30800/api/v1/articles` returns `500`, but the response body comes from `blog-api`, which proves the proxy hits the expected upstream.
- `https://www.b022mc.cn/` returns `200 OK` through Caddy.
- `https://www.b022mc.cn/api/v1/articles` returns `500`, again proving the request crosses Caddy and reaches `blog-api`.

## Boundary Conclusion

The host-level reverse proxy upstream is correctly pointed at the real K3s entry
ports. The remaining production failures are split out of this issue:

- Root domain TLS failure for `b022mc.cn` is a certificate / DNS issue, not an upstream mapping issue.
- `blog-api` `500` responses are caused by the backend application path. The live
  error body on 2026-03-21 was `Table 'blog.articles' doesn't exist`, which
  indicates a schema / initialization problem behind the proxy.

## Follow-Up Commands

```bash
ss -lntp | egrep ':(80|443|30180|30800|6443)\\b' || true
sed -n '1,240p' /opt/caddy/Caddyfile
k3s kubectl -n blog get svc frontend blog-api -o wide
k3s kubectl -n blog logs deploy/article --tail=120
```
