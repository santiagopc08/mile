export class CognitiveMetrics {
  constructor() {
    this.totalPerceptions = 0;
    this.totalPlansCreated = 0;
  }
}

export class CognitiveProfiler {
  constructor() {
    this.metrics = new CognitiveMetrics();
  }

  getReport() {
    return {
      totalPerceptions: this.metrics.totalPerceptions,
    };
  }
}
