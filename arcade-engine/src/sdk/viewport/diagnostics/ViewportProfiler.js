export class ViewportMetrics {
  constructor() {
    this.activeViewportsCount = 0;
  }
}

export class ViewportProfiler {
  constructor(manager) {
    this.manager = manager;
    this.metrics = new ViewportMetrics();
  }

  getReport() {
    return {
      activeViewports: this.manager ? this.manager.collection.viewports.size : 0,
    };
  }
}
