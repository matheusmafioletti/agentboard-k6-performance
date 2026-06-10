export const TEST_PASSWORD = 'PerfTest@123';

function randomSuffix(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateEmail(): string {
  return `perf-${randomSuffix(10)}@agentboard.local`;
}

export function generateTenantName(): string {
  return `Perf Tenant ${randomSuffix(6)}`;
}

export function generateProjectName(): string {
  return `Perf Project ${randomSuffix(6)}`;
}

export function generateWorkItemTitle(): string {
  return `Perf Item ${randomSuffix(8)}`;
}

export function generateUserName(): string {
  return `Perf User ${randomSuffix(4)}`;
}
