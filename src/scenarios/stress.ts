import { Options } from 'k6/options';
import { boardFlow } from '@flows/board-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: SLOS.stress,
};

export default function (): void {
  boardFlow();
}
