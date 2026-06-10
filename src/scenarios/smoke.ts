import { Options } from 'k6/options';
import { authFlow } from '@flows/auth-flow';
import { boardFlow } from '@flows/board-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  vus: 1,
  iterations: 1,
  thresholds: SLOS.smoke,
};

export default function (): void {
  authFlow();
  boardFlow();
}
