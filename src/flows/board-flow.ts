import http from 'k6/http';
import { check, sleep } from 'k6';
import { login, getAuthHeaders } from '@helpers/auth';
import { ENV } from '@config/environment';

export function boardFlow(): void {
  const { token, tenantId } = login(ENV.testEmail, ENV.testPassword);
  const headers = getAuthHeaders(token, tenantId);

  const projectsResponse = http.get(`${ENV.boardBaseUrl}/projects`, { headers });
  check(projectsResponse, { 'list projects is 200': (r) => r.status === 200 });

  const projects = JSON.parse(projectsResponse.body as string);
  if (!projects?.length) return;

  const projectId = projects[0].id;

  const createResponse = http.post(
    `${ENV.boardBaseUrl}/projects/${projectId}/work-items`,
    JSON.stringify({ title: `Perf test item ${Date.now()}`, type: 'TASK' }),
    { headers }
  );
  check(createResponse, { 'create work item is 201': (r) => r.status === 201 });

  sleep(1);
}
