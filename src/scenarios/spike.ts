import { Options } from 'k6/options';
import { authLoginFlow } from '@flows/auth-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  stages: [
    { duration: '10s', target: 0 },
    { duration: '10s', target: 150 },
    { duration: '10s', target: 150 },
    { duration: '10s', target: 0 },
  ],
  thresholds: SLOS.spike,
};

export default function (): void {
  authLoginFlow();
}
