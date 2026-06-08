import { RefinedResponse } from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

export const errorCounter = new Counter('api_errors');
export const authDuration = new Trend('auth_request_duration', true);
export const boardDuration = new Trend('board_request_duration', true);

export function checkResponse(
  response: RefinedResponse<'text'>,
  expectedStatus: number,
  checkName: string
): boolean {
  const passed = check(response, {
    [`${checkName} status ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
  if (!passed) errorCounter.add(1);
  return passed;
}
