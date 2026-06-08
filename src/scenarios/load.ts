import { Options } from 'k6/options';
import { boardFlow } from '@flows/board-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: SLOS.load,
};

export default function (): void {
  boardFlow();
}
