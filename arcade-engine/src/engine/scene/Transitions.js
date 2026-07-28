/**
 * Scene Transition Helpers.
 */
export class SceneTransition {
  /**
   * Fade Transition Controller.
   * @param {number} [durationSec=0.5] 
   */
  constructor(durationSec = 0.5) {
    this.duration = durationSec;
    this.elapsed = 0;
    this.progress = 0;
    this.isTransitioning = false;
    this.onComplete = null;
  }

  start(onComplete) {
    this.elapsed = 0;
    this.progress = 0;
    this.isTransitioning = true;
    this.onComplete = onComplete;
  }

  update(dt) {
    if (!this.isTransitioning) return;
    this.elapsed += dt;
    this.progress = Math.min(1.0, this.elapsed / this.duration);

    if (this.progress >= 1.0) {
      this.isTransitioning = false;
      if (this.onComplete) this.onComplete();
    }
  }
}
