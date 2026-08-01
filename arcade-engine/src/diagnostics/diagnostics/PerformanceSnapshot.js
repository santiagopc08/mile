export class PerformanceSnapshot {
  constructor(fps = 60, frameTimeMs = 16.6) {
    this.fps = fps;
    this.frameTimeMs = frameTimeMs;
    this.timestamp = Date.now();
  }
}

export class MetricsDashboard {
  constructor() {
    this.snapshots = [];
  }
}

export class RuntimeStatistics {
  constructor() {
    this.totalFrames = 0;
  }
}
