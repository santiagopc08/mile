export class FrameClock {
  constructor() {
    this.frameCount = 0;
  }

  tick() {
    this.frameCount++;
    return this.frameCount;
  }

  reset() {
    this.frameCount = 0;
  }
}
