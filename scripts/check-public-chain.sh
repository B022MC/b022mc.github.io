#!/usr/bin/env bash

set -euo pipefail

DOMAINS="${DOMAINS:-b022mc.cn www.b022mc.cn}"
SITE_PATHS="${SITE_PATHS:-/ /api/v1/articles}"
NODE_HOST="${NODE_HOST:-}"
FRONTEND_NODE_PORT="${FRONTEND_NODE_PORT:-30180}"
BLOG_API_NODE_PORT="${BLOG_API_NODE_PORT:-30800}"
INGRESS_NAMESPACE="${INGRESS_NAMESPACE:-blog}"
INGRESS_NAME="${INGRESS_NAME:-blog-web}"
SKIP_K8S="${SKIP_K8S:-0}"

FAILED=0

log() {
  printf '\n[%s] %s\n' "$1" "$2"
}

warn() {
  log "WARN" "$1"
}

fail() {
  log "FAIL" "$1"
  FAILED=1
}

pass() {
  log "PASS" "$1"
}

require_optional_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    warn "Missing optional command: ${command_name}"
    return 1
  fi
  return 0
}

check_dns() {
  if ! require_optional_command dig; then
    return 0
  fi

  for domain in ${DOMAINS}; do
    log "STEP" "DNS lookup for ${domain}"
    if dig +short "$domain" | sed '/^$/d' | tee /dev/stderr | grep -q .; then
      pass "Resolved ${domain}"
    else
      fail "No DNS answer for ${domain}"
    fi
  done
}

check_https() {
  if ! require_optional_command curl; then
    return 0
  fi

  for domain in ${DOMAINS}; do
    for path in ${SITE_PATHS}; do
      log "STEP" "HTTPS GET ${domain}${path}"
      if curl -fsS --max-time 10 -D /tmp/check-public-chain.headers.$$ -o /dev/null "https://${domain}${path}" 2>/tmp/check-public-chain.err.$$; then
        sed -n '1,5p' /tmp/check-public-chain.headers.$$ >&2
        pass "HTTPS reachable for ${domain}${path}"
      else
        cat /tmp/check-public-chain.err.$$ >&2 || true
        fail "HTTPS failed for ${domain}${path}"
      fi
    done
  done

  rm -f /tmp/check-public-chain.headers.$$ /tmp/check-public-chain.err.$$ 2>/dev/null || true
}

check_nodeports() {
  if [ -z "${NODE_HOST}" ]; then
    warn "NODE_HOST is not set; skipping direct node port checks"
    return 0
  fi

  if ! require_optional_command curl; then
    return 0
  fi

  log "STEP" "Frontend node port http://${NODE_HOST}:${FRONTEND_NODE_PORT}/"
  if curl -fsS --max-time 10 -o /dev/null "http://${NODE_HOST}:${FRONTEND_NODE_PORT}/"; then
    pass "Frontend node port reachable"
  else
    fail "Frontend node port unreachable"
  fi

  log "STEP" "Blog API node port http://${NODE_HOST}:${BLOG_API_NODE_PORT}/api/v1/articles"
  if curl -fsS --max-time 10 -o /dev/null "http://${NODE_HOST}:${BLOG_API_NODE_PORT}/api/v1/articles"; then
    pass "Blog API node port reachable"
  else
    fail "Blog API node port unreachable"
  fi
}

check_k8s() {
  if [ "${SKIP_K8S}" = "1" ]; then
    warn "SKIP_K8S=1; skipping kubectl checks"
    return 0
  fi

  if ! require_optional_command kubectl; then
    return 0
  fi

  log "STEP" "Ingress description ${INGRESS_NAMESPACE}/${INGRESS_NAME}"
  if kubectl -n "${INGRESS_NAMESPACE}" get ingress "${INGRESS_NAME}" >/tmp/check-public-chain.k8s.$$ 2>/tmp/check-public-chain.k8s.err.$$; then
    sed -n '1,20p' /tmp/check-public-chain.k8s.$$ >&2
    pass "Ingress exists"
  else
    cat /tmp/check-public-chain.k8s.err.$$ >&2 || true
    fail "Ingress lookup failed"
  fi

  log "STEP" "Service endpoints"
  if kubectl -n "${INGRESS_NAMESPACE}" get svc frontend blog-api >/tmp/check-public-chain.svc.$$ 2>/tmp/check-public-chain.svc.err.$$; then
    sed -n '1,20p' /tmp/check-public-chain.svc.$$ >&2
    pass "Frontend and blog-api services exist"
  else
    cat /tmp/check-public-chain.svc.err.$$ >&2 || true
    fail "Service lookup failed"
  fi

  rm -f /tmp/check-public-chain.k8s.$$ /tmp/check-public-chain.k8s.err.$$ \
    /tmp/check-public-chain.svc.$$ /tmp/check-public-chain.svc.err.$$ 2>/dev/null || true
}

log "INFO" "Starting public chain checks"
check_dns
check_https
check_nodeports
check_k8s

if [ "${FAILED}" -ne 0 ]; then
  fail "At least one chain check failed"
  exit 1
fi

pass "All requested checks passed"
