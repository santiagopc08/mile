export class RuntimeMetrics {
  constructor() {
    this.totalFrames = 0;
    this.fps = 60;
  }
}

export class RuntimeProfiler {
  constructor(runtime) {
    this.runtime = runtime;
    this.metrics = new RuntimeMetrics();
  }

  getReport() {
    return {
      state: this.runtime ? this.runtime.lifecycle.state : 'UNKNOWN',
      frameCount: this.runtime ? this.runtime.frameCount : 0,
      systemCount: this.runtime ? this.runtime.registry.collection.systems.size : 0,
    };
  }
}
