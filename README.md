# agentboard-k6-performance

![CI](https://github.com/matheusmafioletti/agentboard-k6-performance/actions/workflows/ci.yml/badge.svg)

Performance test suite for the AgentBoard API using [K6](https://k6.io/) with TypeScript.

---

## Prerequisites

- **Node.js 20+**
- **K6** installed locally:
  - Windows: `choco install k6`
  - macOS: `brew install k6`
  - Linux: see [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/)
- **AgentBoard services running locally** (auth-service on `:8080`, board-service on `:8081`)

---

## Setup

```bash
npm install
cp .env.example .env
npm run setup:user   # creates perf-test@agentboard.local (idempotent)
```

For CI or shared environments, configure GitHub secrets instead:

- `PERF_TEST_EMAIL` / `PERF_TEST_PASSWORD` — credentials for the perf-test tenant
- Variables: `AUTH_BASE_URL`, `BOARD_BASE_URL` — for staging environments

---

## Build

Webpack bundles the TypeScript scenarios into K6-compatible JS files in `dist/`:

```bash
npm run build
```

---

## Running Scenarios

Each scenario runs `npm run build` automatically:

```bash
npm run smoke     # 1 VU, 1 iteration — auth + board sanity check
npm run load      # ramp 10→50 VUs over 4 min — board read/write
npm run stress    # ramp to 200 VUs — board breaking point
npm run spike     # 0→150→0 VUs in 30s — login spike
npm run soak      # 30 VUs for 30 min — board stability
```

Save results to JSON:

```bash
npm run smoke:out   # writes results/smoke.json
```

Pass environment variables at runtime:

```bash
k6 run -e AUTH_BASE_URL=http://staging:8080 -e TEST_EMAIL=user@test.com dist/smoke.js
```

---

## Scenario Reference

| Scenario | VUs | Duration | Flow | SLO p(95) | Error rate | Checks |
|----------|-----|----------|------|-----------|------------|--------|
| **smoke** | 1 | 1 iter (~30s) | auth-flow + board-flow | < 300ms | < 0.1% | > 99% |
| **load** | 50 peak | ~4 min | board-flow | < 500ms | < 1% | > 99% |
| **stress** | 200 peak | ~8 min | board-flow | < 1000ms | < 5% | > 95% |
| **spike** | 150 peak | ~30s | auth login spike | < 2000ms | < 10% | > 90% |
| **soak** | 30 constant | ~34 min | board-flow loop | < 500ms | < 1% | > 99% |

### When to use each

- **Before every release**: run `smoke` to confirm no regressions.
- **Weekly / pre-release**: run `load` to verify normal-traffic SLOs.
- **Capacity planning**: run `stress` to understand maximum throughput.
- **After major deployments**: run `spike` to confirm login handles burst traffic.
- **Before infrastructure changes**: run `soak` to detect memory leaks and gradual degradation.

---

## Interpreting Results

K6 prints a summary at the end of each run. Key metrics:

| Metric | What it means | Target |
|--------|---------------|--------|
| `http_req_duration p(95)` | 95% of requests completed within this time | smoke: <300ms, load: <500ms, stress: <1s |
| `http_req_duration p(99)` | 99th percentile latency | monitor for tail latency |
| `http_req_failed rate` | Fraction of requests that returned non-2xx or network error | scenario-specific (see table) |
| `checks rate` | Fraction of `check()` assertions that passed | >99% (load/soak), >90% (spike) |
| `api_errors` | Custom counter incremented on failed checks | 0 (smoke/load) |
| `auth_request_duration` | Custom trend for auth-service calls | compare across runs |
| `board_request_duration` | Custom trend for board-service calls | compare across runs |

### Example output interpretation

```
✓ login status 200
✓ list-projects status 200
✓ create-work-item status 201

http_req_duration.............: avg=123ms  p(90)=210ms  p(95)=280ms  p(99)=450ms
http_req_failed...............: 0.00%
checks........................: 100.00%
```

A `✗` on a check means that specific assertion failed for at least one request. Threshold breaches cause K6 to exit with code `99`, failing CI.

---

## API Paths (verified against backend)

| Service | Endpoint | Method |
|---------|----------|--------|
| auth | `/auth/register` | POST |
| auth | `/auth/login` | POST |
| auth | `/auth/select-tenant` | POST |
| auth | `/auth/me/memberships` | GET |
| auth | `/auth/tenants` | POST |
| auth | `/auth/tenants/:tenantId/invites` | POST |
| auth | `/auth/invites/:token/accept` | POST |
| board | `/api/v1/projects` | GET, POST |
| board | `/api/v1/work-items?projectId=` | GET, POST |
| board | `/api/v1/work-items/:id/status` | PATCH |

Board requests require `Authorization: Bearer {token}` and `X-Tenant-Id: {tenantId}`.

---

## Project Structure

```
src/
├── config/
│   └── environment.ts      # Base URLs, API paths, SLO thresholds (__ENV)
├── helpers/
│   ├── api.ts              # Metrics, checkResponse(), randomSleep()
│   ├── auth.ts             # register, login, selectTenant, createTenant, invites
│   ├── board.ts            # projects, work items, boardFlow()
│   └── data.ts             # generateEmail(), TEST_PASSWORD, etc.
├── flows/
│   ├── auth-flow.ts        # register → login → list → create tenant
│   ├── board-flow.ts       # re-exports boardFlow
│   ├── invite-flow.ts      # admin create invite → accept
│   └── full-journey-flow.ts # register → project → 3 work items → update
└── scenarios/
    ├── smoke.ts
    ├── load.ts
    ├── stress.ts
    ├── spike.ts
    └── soak.ts
scripts/
└── setup-perf-user.mjs     # one-time perf user bootstrap
```

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on push/PR:

1. Installs Node.js 20 and dependencies
2. Builds the TypeScript bundle
3. Installs K6 via `grafana/setup-k6-action`
4. Always runs `smoke` — confirms basic health
5. Optionally runs a selected scenario via `workflow_dispatch`
6. Uploads JSON result artifacts (retained 30 days)

---

## Architecture Notes

K6 runs on the **Goja** JavaScript runtime, not Node.js. The Webpack bundle:

- Transpiles TypeScript with `ts-loader`
- Sets `target: 'web'` (no Node.js built-ins)
- Marks all `k6/*` and HTTP URL imports as **externals** — resolved at K6 runtime
- Disables minification for readable output and easier debugging

Think time between requests uses `randomSleep(0.5, 2)` to simulate realistic user pacing.
