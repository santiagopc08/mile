export class RenderingMetrics {
  constructor() {
    this.drawCalls = 0;
    this.totalBatches = 0;
  }
}

export class RenderingProfiler {
  constructor(renderingSystem) {
    this.renderingSystem = renderingSystem;
    this.metrics = new RenderingMetrics();
  }

  getReport() {
    return {
      drawCalls: this.metrics.drawCalls,
    };
  }
}
