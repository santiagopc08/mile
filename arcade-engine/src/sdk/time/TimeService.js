import { RealClock } from './RealClock.js';
import { GameClock } from './GameClock.js';
import { FrameClock } from './FrameClock.js';

export class TimeService {
  constructor(timeScale = 1.0) {
    this.realClock = new RealClock();
    this.gameClock = new GameClock(timeScale);
    this.frameClock = new FrameClock();
  }

  tick(deltaSeconds) {
    this.realClock.tick();
    const scaledDt = this.gameClock.tick(deltaSeconds);
    this.frameClock.tick();
    return scaledDt;
  }

  setTimeScale(scale) {
    this.gameClock.timeScale = scale;
  }

  getTimeScale() {
    return this.gameClock.timeScale;
  }

  pause() {
    this.gameClock.pause();
  }

  resume() {
    this.gameClock.resume();
  }

  isPaused() {
    return this.gameClock.isPaused;
  }

  getGameTime() {
    return this.gameClock.elapsedTime;
  }

  getRealTime() {
    return this.realClock.elapsedTime;
  }

  getFrameCount() {
    return this.frameClock.frameCount;
  }
}
