import { RefinedResponse } from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

export const errorCounter = new Counter('api_errors');
export const successCounter = new Counter('api_success');
export const authDuration = new Trend('auth_request_duration', true);
export const boardDuration = new Trend('board_request_duration', true);
export const projectDuration = new Trend('project_request_duration', true);
export const workItemDuration = new Trend('work_item_request_duration', true);

export function checkResponse(
  response: RefinedResponse<'text'>,
  expectedStatus: number,
  checkName: string
): boolean {
  const passed = check(response, {
    [`${checkName} status ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
  if (passed) {
    successCounter.add(1);
  } else {
    errorCounter.add(1);
  }
  return passed;
}

export function randomSleep(minSeconds = 0.5, maxSeconds = 2): void {
  const duration = minSeconds + Math.random() * (maxSeconds - minSeconds);
  sleep(duration);
}

export function parseJson<T>(body: string | ArrayBuffer | null): T {
  return JSON.parse(body as string) as T;
}
