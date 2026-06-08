import { Options } from 'k6/options';
import { boardFlow } from '@flows/board-flow';
import { SLOS } from '@config/environment';

export const options: Options = {
  stages: [
    { duration: '2m', target: 30 },
    { duration: '30m', target: 30 },
    { duration: '2m', target: 0 },
  ],
  thresholds: SLOS.load,
};

export default function (): void {
  boardFlow();
}
