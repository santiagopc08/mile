export class FrameContext {
  constructor(frameNumber = 0, dt = 0.016, elapsedTime = 0) {
    this.frameNumber = frameNumber;
    this.dt = dt;
    this.elapsedTime = elapsedTime;
    this.isCancelled = false;
  }
}

export class RuntimeConfiguration {
  constructor(targetFPS = 60, frameBudgetMs = 16.66) {
    this.targetFPS = targetFPS;
    this.frameBudgetMs = frameBudgetMs;
  }
}

export class RuntimeContext {
  constructor(config = new RuntimeConfiguration()) {
    this.config = config;
    this.services = new Map();
  }
}
