import http from 'k6/http';
import { check } from 'k6';
import { ENV, API } from '@config/environment';
import {
  authDuration,
  checkResponse,
  parseJson,
} from '@helpers/api';

export interface AuthResult {
  token: string;
  tenantId: string;
  userId?: string;
}

interface SessionResponse {
  token: string;
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  name: string;
}

interface TenantSelectionResponse {
  requiresTenantSelection: boolean;
  userId: string;
  email: string;
  name: string;
  memberships: Array<{ tenantId: string; tenantName: string }>;
}

interface RegisterResponse {
  userId: string;
  tenantId: string;
  tenantName: string;
  token: string;
}

interface CreateTenantResponse {
  session: SessionResponse;
  apiKey: string;
}

interface MembershipListResponse {
  memberships: Array<{ tenantId: string; tenantName: string }>;
}

interface CreateInviteResponse {
  id: string;
  email: string;
  status: string;
  inviteUrl: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function sessionToAuth(session: SessionResponse): AuthResult {
  return {
    token: session.token,
    tenantId: session.tenantId,
    userId: session.userId,
  };
}

export function register(
  email: string,
  password: string,
  tenantName: string,
  name = 'Perf Test User'
): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.register}`,
    JSON.stringify({ name, email, password, tenantName }),
    { headers: JSON_HEADERS, tags: { name: 'auth_register' } }
  );
  authDuration.add(response.timings.duration);

  checkResponse(response, 201, 'register');
  const body = parseJson<RegisterResponse>(response.body);
  check(body, {
    'register token present': (b) => !!b.token,
    'register tenantId present': (b) => !!b.tenantId,
  });

  return { token: body.token, tenantId: body.tenantId, userId: body.userId };
}

export function login(email: string, password: string): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.login}`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS, tags: { name: 'auth_login' } }
  );
  authDuration.add(response.timings.duration);

  checkResponse(response, 200, 'login');
  const body = parseJson<SessionResponse | TenantSelectionResponse>(response.body);

  if ('requiresTenantSelection' in body && body.requiresTenantSelection) {
    const tenantId = body.memberships[0]?.tenantId;
    check(body, {
      'login memberships present': (b) => b.memberships.length > 0,
    });
    return selectTenant(email, password, tenantId);
  }

  const session = body as SessionResponse;
  check(session, { 'login token present': (s) => !!s.token });
  return sessionToAuth(session);
}

export function selectTenant(
  email: string,
  password: string,
  tenantId: string
): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.selectTenant}`,
    JSON.stringify({ email, password, tenantId }),
    { headers: JSON_HEADERS, tags: { name: 'auth_select_tenant' } }
  );
  authDuration.add(response.timings.duration);

  checkResponse(response, 200, 'select-tenant');
  const session = parseJson<SessionResponse>(response.body);
  return sessionToAuth(session);
}

export function listMemberships(token: string): MembershipListResponse {
  const response = http.get(`${ENV.authBaseUrl}${API.auth.memberships}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'auth_list_memberships' },
  });
  authDuration.add(response.timings.duration);
  checkResponse(response, 200, 'list-memberships');
  return parseJson<MembershipListResponse>(response.body);
}

export function createTenant(token: string, tenantName: string): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.tenants}`,
    JSON.stringify({ tenantName }),
    {
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'auth_create_tenant' },
    }
  );
  authDuration.add(response.timings.duration);
  checkResponse(response, 201, 'create-tenant');
  const body = parseJson<CreateTenantResponse>(response.body);
  return sessionToAuth(body.session);
}

export function createInvite(
  token: string,
  tenantId: string,
  email: string
): CreateInviteResponse {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.invites(tenantId)}`,
    JSON.stringify({ email }),
    {
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'auth_create_invite' },
    }
  );
  authDuration.add(response.timings.duration);
  checkResponse(response, 201, 'create-invite');
  return parseJson<CreateInviteResponse>(response.body);
}

export function acceptInvite(
  token: string,
  name: string,
  password: string
): AuthResult {
  const response = http.post(
    `${ENV.authBaseUrl}${API.auth.inviteAccept(token)}`,
    JSON.stringify({ name, password }),
    { headers: JSON_HEADERS, tags: { name: 'auth_accept_invite' } }
  );
  authDuration.add(response.timings.duration);
  checkResponse(response, 200, 'accept-invite');
  const session = parseJson<SessionResponse>(response.body);
  return sessionToAuth(session);
}

export function extractInviteToken(inviteUrl: string): string {
  const marker = '/invite/';
  const index = inviteUrl.lastIndexOf(marker);
  return index >= 0 ? inviteUrl.substring(index + marker.length) : inviteUrl;
}

export function getAuthHeaders(token: string, tenantId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
  };
}

export function loginWithEnvCredentials(): AuthResult {
  if (ENV.testTenantId) {
    return selectTenant(ENV.testEmail, ENV.testPassword, ENV.testTenantId);
  }
  return login(ENV.testEmail, ENV.testPassword);
}
