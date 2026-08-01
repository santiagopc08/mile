export class DecisionMetrics {
  constructor() {
    this.totalEvaluations = 0;
    this.totalTransitions = 0;
  }
}

export class DecisionProfiler {
  constructor() {
    this.metrics = new DecisionMetrics();
  }

  getReport() {
    return {
      evaluationsCount: this.metrics.totalEvaluations,
    };
  }
}
