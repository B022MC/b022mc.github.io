# Blog Acceptance Baseline

This document is the execution baseline for improving the blog project. It turns
the roadmap and issues CSV into a concrete acceptance contract so later issues
can prove completion against the same boundary.

## Scope

- Public site must be reachable through the production domain strategy.
- Frontend pages must use real backend data by default.
- Comment creation and comment loading must be observable and retryable.
- Deployment must have health checks, diagnostics, and a rollback path.
- The repository must contain automated tests for critical frontend and backend paths.

## Acceptance Checklist

| Category | Acceptance boundary | Evidence to attach | Blocking examples |
| --- | --- | --- | --- |
| Access availability | `https://b022mc.cn` and `https://www.b022mc.cn` return successful responses and follow the intended redirect strategy. | Curl output, browser capture, ingress/proxy config diff. | DNS mismatch, TLS failure, `502`, redirect loop. |
| Real data path | Home, tag, detail, auth, admin, and comment flows use the real API path by default. | UI capture, API response sample, changed code refs. | Mock fallback, hidden API errors, stale local-only behavior. |
| Comment usability | Comment list failures and submit failures are visible, retryable, and do not silently succeed. | UI capture, request/response sample, regression notes. | Empty-state masking, silent failure, duplicate submit. |
| Deployability | CI deploy runs health checks, emits useful diagnostics, and documents rollback steps. | Workflow log, health check command, rollback note. | Rollout timeout without diagnostics, no rollback instructions. |
| Test coverage | Frontend and backend critical paths have runnable automated checks or limited-validation notes. | Test command output, issue CSV note, changed test refs. | No test command, unverifiable high-risk change. |

## Completion Gate

An issue is only considered truly done when all of the following are true:

1. The code or documentation change stays within the issue description.
2. The issue acceptance criteria can be proven with attached evidence.
3. Review checkpoints have been executed and written back to the issue CSV.
4. Limited validation, if any, is explicit about missing tests and residual risk.
5. The issue CSV and the implementation change are committed together.

## Evidence Pattern

Every completed issue should be able to point to:

- one or more repository refs (`path:line`);
- one verification artifact such as test output, command output, or a manual flow;
- one notes entry in the issue CSV that records validation status and remaining risk.

## Mapping To Existing Project Documents

- Roadmap priority and rollout goals live in `ROADMAP.md`.
- Execution sequencing and issue boundary live in the current issues CSV snapshot.
- Per-issue implementation details should stay out of this baseline and instead live
  in code, tests, or targeted runbooks.
