import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, getAuthHeaders } from '@helpers/auth';
import { ENV } from '@config/environment';

export function authFlow(): void {
  const { token, tenantId } = login(ENV.testEmail, ENV.testPassword);

  const tenantsResponse = http.get(
    `${ENV.authBaseUrl}/auth/tenants`,
    { headers: getAuthHeaders(token, tenantId) }
  );

  check(tenantsResponse, {
    'list tenants status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
