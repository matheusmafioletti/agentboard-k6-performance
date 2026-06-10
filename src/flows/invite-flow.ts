import { check } from 'k6';
import { randomSleep } from '@helpers/api';
import {
  acceptInvite,
  createInvite,
  extractInviteToken,
  loginWithEnvCredentials,
} from '@helpers/auth';
import { generateEmail, generateUserName, TEST_PASSWORD } from '@helpers/data';

export function inviteFlow(accept = true): void {
  const admin = loginWithEnvCredentials();
  randomSleep();

  const inviteeEmail = generateEmail();
  const invite = createInvite(admin.token, admin.tenantId, inviteeEmail);
  check(invite, {
    'invite status pending': (i) => i.status === 'PENDING',
    'invite url present': (i) => !!i.inviteUrl,
  });
  randomSleep();

  if (!accept) {
    return;
  }

  const token = extractInviteToken(invite.inviteUrl);
  const accepted = acceptInvite(token, generateUserName(), TEST_PASSWORD);
  check(accepted, {
    'invite accepted tenant matches': (a) => a.tenantId === admin.tenantId,
    'invite accepted token present': (a) => !!a.token,
  });
  randomSleep();
}
