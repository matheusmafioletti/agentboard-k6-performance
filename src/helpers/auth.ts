import http from 'k6/http';
import { check } from 'k6';
import { ENV } from '@config/environment';

export interface AuthResult {
  token: string;
  tenantId: string;
}

export function login(email: string, password: string): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'login status is 200': (r) => r.status === 200,
    'token is present': (r) => !!JSON.parse(r.body as string).token,
  });

  const body = JSON.parse(response.body as string);
  return {
    token: body.token,
    tenantId: body.tenantId ?? body.memberships?.[0]?.tenantId ?? '',
  };
}

export function getAuthHeaders(token: string, tenantId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
  };
}
