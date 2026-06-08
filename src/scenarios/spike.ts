import { Options } from 'k6/options';
import { authFlow } from '@flows/auth-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '10s', target: 150 },
    { duration: '1m', target: 150 },
    { duration: '10s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: SLOS.stress,
};

export default function (): void {
  authFlow();
}
