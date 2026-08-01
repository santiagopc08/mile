export class GameClock {
  constructor(timeScale = 1.0) {
    this.timeScale = timeScale;
    this.elapsedTime = 0;
    this.isPaused = false;
  }

  tick(deltaSeconds) {
    if (this.isPaused) return 0;
    const scaledDt = deltaSeconds * this.timeScale;
    this.elapsedTime += scaledDt;
    return scaledDt;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }
}
