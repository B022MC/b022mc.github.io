# Public Access Diagnostics

Use `scripts/check-public-chain.sh` to inspect the production access path in the
same order as the execution plan:

1. DNS resolution for `b022mc.cn` and `www.b022mc.cn`
2. HTTPS reachability for `/` and `/api/v1/articles`
3. Optional direct checks against frontend and blog-api node ports
4. Optional Kubernetes ingress and service checks

## Usage

```bash
bash scripts/check-public-chain.sh
```

Optional environment variables:

```bash
NODE_HOST=119.27.191.212 \
FRONTEND_NODE_PORT=30180 \
BLOG_API_NODE_PORT=30800 \
bash scripts/check-public-chain.sh
```

Skip cluster checks when `kubectl` is unavailable:

```bash
SKIP_K8S=1 bash scripts/check-public-chain.sh
```

## Intended Output

- Which domain or path fails first
- Whether the failure happens before or after node-port reachability
- Whether ingress and service objects exist inside the cluster

The script is designed for repeatable diagnostics and should be attached as
evidence in issue notes or deployment reviews.
