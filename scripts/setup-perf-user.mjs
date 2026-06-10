/**
 * Creates a dedicated performance-test user via the auth-service register API.
 * Run before load/stress/soak scenarios when no PERF_TEST_* secrets are configured.
 *
 * Usage: npm run setup:user
 * Env:   AUTH_BASE_URL (default http://localhost:8080)
 */

const AUTH_BASE_URL = process.env.AUTH_BASE_URL ?? 'http://localhost:8080';
const PERF_TEST_EMAIL = process.env.PERF_TEST_EMAIL ?? 'perf-test@agentboard.local';
const PERF_TEST_PASSWORD = process.env.PERF_TEST_PASSWORD ?? 'PerfTest@123';
const PERF_TEST_TENANT = process.env.PERF_TEST_TENANT ?? 'Perf Test Workspace';

async function main(): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Perf Test User',
      email: PERF_TEST_EMAIL,
      password: PERF_TEST_PASSWORD,
      tenantName: PERF_TEST_TENANT,
    }),
  });

  if (response.status === 201) {
    const body = await response.json();
    console.log('Performance user created successfully.');
    console.log(`  Email:    ${PERF_TEST_EMAIL}`);
    console.log(`  Password: ${PERF_TEST_PASSWORD}`);
    console.log(`  TenantId: ${body.tenantId}`);
    console.log('');
    console.log('Export these for K6 runs:');
    console.log(`  TEST_EMAIL=${PERF_TEST_EMAIL}`);
    console.log(`  TEST_PASSWORD=${PERF_TEST_PASSWORD}`);
    console.log(`  TEST_TENANT_ID=${body.tenantId}`);
    return;
  }

  if (response.status === 409) {
    console.log(`User ${PERF_TEST_EMAIL} already exists — reusing credentials.`);
    console.log(`  TEST_EMAIL=${PERF_TEST_EMAIL}`);
    console.log(`  TEST_PASSWORD=${PERF_TEST_PASSWORD}`);
    return;
  }

  const errorBody = await response.text();
  console.error(`Setup failed (${response.status}): ${errorBody}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
