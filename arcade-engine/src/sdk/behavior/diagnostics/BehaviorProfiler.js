export class BehaviorMetrics {
  constructor() {
    this.totalTasksExecuted = 0;
  }
}

export class BehaviorProfiler {
  constructor() {
    this.metrics = new BehaviorMetrics();
  }

  getReport() {
    return {
      executedTasks: this.metrics.totalTasksExecuted,
    };
  }
}
