/**
 * Deterministic Performance Time & Frame Clock.
 */
export class Clock {
  constructor() {
    this.startTime = this.now();
    this.lastTime = this.startTime;
    this.elapsedTime = 0;
    this.deltaTime = 0;
  }

  now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  tick() {
    const currentTime = this.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.elapsedTime += this.deltaTime;
    return this.deltaTime;
  }

  reset() {
    this.startTime = this.now();
    this.lastTime = this.startTime;
    this.elapsedTime = 0;
    this.deltaTime = 0;
  }
}
