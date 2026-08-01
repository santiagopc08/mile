export class PresentationMetrics {
  constructor() {
    this.totalAnimationsPlaying = 0;
  }
}

export class AnimationProfiler {
  constructor() {
    this.metrics = new PresentationMetrics();
  }

  getReport() {
    return {
      activeAnimations: this.metrics.totalAnimationsPlaying,
    };
  }
}
