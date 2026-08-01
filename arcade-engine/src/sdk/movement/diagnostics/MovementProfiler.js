export class MovementMetrics {
  constructor() {
    this.totalDistanceTraveled = 0;
  }
}

export class MovementProfiler {
  constructor() {
    this.metrics = new MovementMetrics();
  }

  getReport() {
    return {
      totalDistance: this.metrics.totalDistanceTraveled,
    };
  }
}
