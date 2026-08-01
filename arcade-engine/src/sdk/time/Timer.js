export class Timer {
  constructor(durationSeconds, options = {}) {
    this.duration = durationSeconds;
    this.elapsed = 0;
    this.active = false;
    this.ignorePause = options.ignorePause || false;
    this.callbacks = [];
  }

  start() {
    this.active = true;
    this.elapsed = 0;
  }

  stop() {
    this.active = false;
  }

  reset() {
    this.elapsed = 0;
    this.active = false;
  }

  onExpired(fn) {
    this.callbacks.push(fn);
  }

  update(dt, isPaused = false) {
    if (!this.active) return;
    if (isPaused && !this.ignorePause) return;

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.callbacks.forEach((cb) => cb());
    }
  }

  get Progress() {
    return Math.min(1.0, this.elapsed / this.duration);
  }
}
