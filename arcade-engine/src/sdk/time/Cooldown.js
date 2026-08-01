import { Timer } from './Timer.js';

export class Cooldown extends Timer {
  trigger() {
    if (this.isReady()) {
      this.start();
      return true;
    }
    return false;
  }

  isReady() {
    return !this.active || this.elapsed >= this.duration;
  }
}
