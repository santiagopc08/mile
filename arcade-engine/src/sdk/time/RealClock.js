export class RealClock {
  constructor() {
    this.startTime = this.now();
    this.lastTime = this.startTime;
    this.elapsedTime = 0;
  }

  now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  tick() {
    const current = this.now();
    const dt = (current - this.lastTime) / 1000;
    this.lastTime = current;
    this.elapsedTime += dt;
    return dt;
  }
}
