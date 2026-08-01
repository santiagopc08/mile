export class ReleaseMetrics {
  constructor() {
    this.qualityGatesPassed = 5;
    this.qualityGatesFailed = 0;
  }
}

export class ReleaseProfiler {
  constructor() {
    this.metrics = new ReleaseMetrics();
  }

  getReport() {
    return {
      qualityGatesPassed: this.metrics.qualityGatesPassed,
    };
  }
}
