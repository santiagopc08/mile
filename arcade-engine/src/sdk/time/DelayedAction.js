import { Countdown } from './Countdown.js';

export class DelayedAction {
  constructor(delaySeconds, actionFn) {
    this.timer = new Countdown(delaySeconds);
    this.timer.onExpired(actionFn);
    this.timer.start();
  }

  update(dt, isPaused) {
    this.timer.update(dt, isPaused);
  }

  cancel() {
    this.timer.stop();
  }
}
