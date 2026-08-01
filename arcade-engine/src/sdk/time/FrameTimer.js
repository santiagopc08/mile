export class FrameTimer {
  constructor(targetFrames) {
    this.targetFrames = targetFrames;
    this.framesElapsed = 0;
    this.active = false;
    this.callbacks = [];
  }

  start() {
    this.active = true;
    this.framesElapsed = 0;
  }

  onExpired(fn) {
    this.callbacks.push(fn);
  }

  update() {
    if (!this.active) return;
    this.framesElapsed++;
    if (this.framesElapsed >= this.targetFrames) {
      this.active = false;
      this.callbacks.forEach((cb) => cb());
    }
  }
}
