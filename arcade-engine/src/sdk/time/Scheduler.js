import { DelayedAction } from './DelayedAction.js';
import { RecurringAction } from './RecurringAction.js';

export class Scheduler {
  constructor() {
    this.tasks = [];
  }

  scheduleDelayed(delaySeconds, actionFn) {
    const task = new DelayedAction(delaySeconds, actionFn);
    this.tasks.push(task);
    return task;
  }

  scheduleRecurring(intervalSeconds, actionFn) {
    const task = new RecurringAction(intervalSeconds, actionFn);
    this.tasks.push(task);
    return task;
  }

  update(dt, isPaused = false) {
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const task = this.tasks[i];
      task.update(dt, isPaused);
      if (task.timer && !task.timer.active && task instanceof DelayedAction) {
        this.tasks.splice(i, 1);
      }
    }
  }

  clear() {
    this.tasks.forEach((t) => t.cancel());
    this.tasks = [];
  }
}
