import { SystemRegistry } from '../registry/SystemRegistry.js';
import { ExecutionPipeline } from '../pipeline/ExecutionPipeline.js';
import { FrameScheduler } from '../pipeline/ExecutionPipeline.js';
import { RuntimeLifecycle, RuntimeState } from '../lifecycle/RuntimeLifecycle.js';
import { FrameContext } from '../pipeline/FrameContext.js';

export class Runtime {
  constructor() {
    this.registry = new SystemRegistry();
    this.pipeline = new ExecutionPipeline(this.registry);
    this.frameScheduler = new FrameScheduler(this.pipeline);
    this.lifecycle = new RuntimeLifecycle();
    this.frameCount = 0;
    this.elapsedTime = 0;
  }

  registerSystem(name, instance, stage, priority, deps) {
    return this.registry.register(name, instance, stage, priority, deps);
  }

  start() {
    this.lifecycle.transitionTo(RuntimeState.RUNNING);
  }

  pause() {
    this.lifecycle.transitionTo(RuntimeState.PAUSED);
  }

  resume() {
    this.lifecycle.transitionTo(RuntimeState.RUNNING);
  }

  stop() {
    this.lifecycle.transitionTo(RuntimeState.STOPPED);
  }

  tick(dt = 0.016) {
    if (this.lifecycle.state !== RuntimeState.RUNNING) return;
    this.frameCount++;
    this.elapsedTime += dt;
    const ctx = new FrameContext(this.frameCount, dt, this.elapsedTime);
    this.frameScheduler.tick(dt, ctx);
  }
}

export class RuntimeBuilder {
  constructor() {
    this.runtime = new Runtime();
  }

  withSystem(name, instance, stage, priority, deps) {
    this.runtime.registerSystem(name, instance, stage, priority, deps);
    return this;
  }

  build() {
    return this.runtime;
  }
}
