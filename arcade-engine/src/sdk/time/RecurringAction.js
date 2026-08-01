import { Interval } from './Interval.js';

export class RecurringAction {
  constructor(intervalSeconds, actionFn) {
    this.timer = new Interval(intervalSeconds);
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
