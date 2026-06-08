# agentboard-k6-performance

![CI](https://github.com/your-org/agentboard-k6-performance/actions/workflows/ci.yml/badge.svg)

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
# Edit .env with real credentials if needed
```

---

## Build

Webpack bundles the TypeScript scenarios into K6-compatible JS files in `dist/`:

```bash
npm run build
```

---

## Running Scenarios

Each scenario first runs `npm run build` automatically:

```bash
npm run smoke     # Sanity check: 1 VU, 2 iterations (~10s)
npm run load      # Normal load: ramp to 50 VUs over 4 min
npm run stress    # Breaking point: ramp to 200 VUs over 8 min
npm run spike     # Sudden spike: 0 → 150 → 0 VUs
npm run soak      # Memory leak detection: 30 VUs for 30+ min
```

Save results to JSON:

```bash
npm run smoke:out   # writes results/smoke.json
```

Passing environment variables at runtime:

```bash
k6 run -e AUTH_BASE_URL=http://staging:8080 -e TEST_EMAIL=user@test.com dist/smoke.js
```

---

## Scenario Reference

| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| **smoke** | 1 | ~10s | Sanity check — confirms the system is up and flows work end-to-end |
| **load** | 50 peak | ~4m | Validates normal expected traffic; should pass SLOs with comfortable margin |
| **stress** | 200 peak | ~8m | Finds the breaking point; SLOs are relaxed (p95<1s) |
| **spike** | 150 sudden | ~2m | Simulates a traffic burst (flash sale, deploy restart); measures recovery time |
| **soak** | 30 constant | ~34m | Long-running test to detect memory leaks and gradual degradation |

### When to use each

- **Before every release**: run `smoke` to confirm no regressions.
- **Weekly / pre-release**: run `load` to verify normal-traffic SLOs.
- **Capacity planning**: run `stress` to understand maximum throughput.
- **After major deployments**: run `spike` to confirm the system handles burst traffic.
- **Before quarterly releases or infrastructure changes**: run `soak` overnight.

---

## Interpreting Results

K6 prints a summary at the end of each run. Key metrics:

| Metric | What it means | Target |
|--------|---------------|--------|
| `http_req_duration p(95)` | 95% of requests completed within this time | smoke: <300ms, load: <500ms, stress: <1s |
| `http_req_duration p(99)` | 99th percentile latency | <1000ms |
| `http_req_failed rate` | Fraction of requests that returned non-2xx or network error | <1% (load), <5% (stress) |
| `checks rate` | Fraction of `check()` assertions that passed | >99% |
| `api_errors` | Custom counter incremented on unexpected responses | 0 (smoke/load) |

### Example output interpretation

```
✓ login status is 200
✓ list projects is 200
✓ create work item is 201

http_req_duration.............: avg=123ms  p(90)=210ms  p(95)=280ms  p(99)=450ms
http_req_failed...............: 0.00%
checks........................: 100.00%
```

A `✗` on a check means that specific assertion failed for at least one request. The `http_req_failed` rate counts network errors and non-2xx responses.

---

## SLOs

| Scenario | p(95) | error rate |
|----------|-------|------------|
| smoke | < 300ms | < 0.1% |
| load | < 500ms | < 1% |
| stress | < 1000ms | < 5% |

Thresholds are enforced via K6's `thresholds` option. If any threshold is breached, K6 exits with code `99` (non-zero), which fails the CI pipeline.

---

## Project Structure

```
src/
├── config/
│   └── environment.ts    # Base URLs and SLO thresholds (reads __ENV)
├── helpers/
│   ├── auth.ts           # login() → AuthResult, getAuthHeaders()
│   └── api.ts            # checkResponse(), custom Trend/Counter metrics
├── flows/
│   ├── auth-flow.ts      # login + list tenants
│   └── board-flow.ts     # login + list projects + create work item
└── scenarios/
    ├── smoke.ts
    ├── load.ts
    ├── stress.ts
    ├── spike.ts
    └── soak.ts
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

Configure secrets in GitHub repository settings:
- `PERF_TEST_EMAIL` / `PERF_TEST_PASSWORD` — credentials for the perf-test tenant
- Variables: `AUTH_BASE_URL`, `BOARD_BASE_URL` — for staging environments

---

## Architecture Notes

K6 runs on the **Goja** JavaScript runtime, not Node.js. The Webpack bundle:

- Transpiles TypeScript with `ts-loader`
- Sets `target: 'web'` (no Node.js built-ins)
- Marks all `k6/*` and HTTP URL imports as **externals** — they are resolved at K6 runtime, not bundled
- Disables minification (`optimization: { minimize: false }`) for readable output and easier debugging
