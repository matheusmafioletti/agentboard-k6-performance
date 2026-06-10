export const ENV = {
  authBaseUrl: __ENV.AUTH_BASE_URL ?? 'http://localhost:8080',
  boardBaseUrl: __ENV.BOARD_BASE_URL ?? 'http://localhost:8081',
  testEmail: __ENV.TEST_EMAIL ?? __ENV.PERF_TEST_EMAIL ?? 'perf-test@agentboard.local',
  testPassword: __ENV.TEST_PASSWORD ?? __ENV.PERF_TEST_PASSWORD ?? 'PerfTest@123',
  testTenantId: __ENV.TEST_TENANT_ID ?? '',
};

export const API = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    selectTenant: '/auth/select-tenant',
    memberships: '/auth/me/memberships',
    tenants: '/auth/tenants',
    invites: (tenantId: string) => `/auth/tenants/${tenantId}/invites`,
    inviteAccept: (token: string) => `/auth/invites/${token}/accept`,
    invitePreview: (token: string) => `/auth/invites/${token}`,
  },
  board: {
    projects: '/api/v1/projects',
    project: (id: string) => `/api/v1/projects/${id}`,
    workItems: '/api/v1/work-items',
    workItem: (id: string) => `/api/v1/work-items/${id}`,
    workItemStatus: (id: string) => `/api/v1/work-items/${id}/status`,
  },
};

export const SLOS = {
  smoke: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.001'],
    checks: ['rate>0.99'],
  },
  load: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  stress: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
  spike: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.10'],
    checks: ['rate>0.90'],
  },
  soak: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};
