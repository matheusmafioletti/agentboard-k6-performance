export const ENV = {
  authBaseUrl: __ENV.AUTH_BASE_URL ?? 'http://localhost:8080',
  boardBaseUrl: __ENV.BOARD_BASE_URL ?? 'http://localhost:8081',
  testEmail: __ENV.TEST_EMAIL ?? 'perf-test@agentboard.local',
  testPassword: __ENV.TEST_PASSWORD ?? 'perf-test-123',
  testTenantId: __ENV.TEST_TENANT_ID ?? '',
};

export const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};

export const SLOS = {
  smoke: { http_req_duration: ['p(95)<300'], http_req_failed: ['rate<0.001'] },
  load: { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] },
  stress: { http_req_duration: ['p(95)<1000'], http_req_failed: ['rate<0.05'] },
};
