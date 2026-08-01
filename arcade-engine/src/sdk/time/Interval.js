import { Timer } from './Timer.js';

export class Interval extends Timer {
  update(dt, isPaused = false) {
    if (!this.active) return;
    if (isPaused && !this.ignorePause) return;

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.elapsed -= this.duration;
      this.callbacks.forEach((cb) => cb());
    }
  }
}
