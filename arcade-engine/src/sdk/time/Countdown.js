import { Timer } from './Timer.js';

export class Countdown extends Timer {
  constructor(durationSeconds, options = {}) {
    super(durationSeconds, options);
  }
}
