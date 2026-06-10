import { check } from 'k6';
import { randomSleep } from '@helpers/api';
import {
  createTenant,
  listMemberships,
  login,
  register,
} from '@helpers/auth';
import {
  generateEmail,
  generateTenantName,
  generateUserName,
  TEST_PASSWORD,
} from '@helpers/data';

export function authFlow(): void {
  const email = generateEmail();
  const tenantName = generateTenantName();
  const name = generateUserName();

  const registered = register(email, TEST_PASSWORD, tenantName, name);
  randomSleep();

  const loggedIn = login(email, TEST_PASSWORD);
  check(loggedIn, {
    'auth flow login token present': (r) => !!r.token,
  });
  randomSleep();

  const memberships = listMemberships(loggedIn.token);
  check(memberships, {
    'auth flow has memberships': (m) => m.memberships.length >= 1,
  });
  randomSleep();

  const secondTenantName = generateTenantName();
  const secondTenant = createTenant(loggedIn.token, secondTenantName);
  check(secondTenant, {
    'auth flow second tenant created': (t) => !!t.tenantId,
    'auth flow second tenant differs': (t) => t.tenantId !== registered.tenantId,
  });
  randomSleep();
}

export function authLoginFlow(): void {
  login(__ENV.TEST_EMAIL ?? __ENV.PERF_TEST_EMAIL ?? 'perf-test@agentboard.local', TEST_PASSWORD);
  randomSleep();
}
