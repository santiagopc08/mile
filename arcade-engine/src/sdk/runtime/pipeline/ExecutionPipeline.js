import { STAGE_ORDER } from './ExecutionStage.js';
import { SystemScheduler } from '../scheduler/SystemScheduler.js';

export class ExecutionPipeline {
  constructor(registry) {
    this.registry = registry;
    this.scheduler = new SystemScheduler(registry);
  }

  executeFrame(frameContext) {
    STAGE_ORDER.forEach((stage) => {
      const systems = this.scheduler.getScheduleForStage(stage);
      systems.forEach((descriptor) => {
        if (descriptor.enabled && typeof descriptor.systemInstance.update === 'function') {
          descriptor.systemInstance.update(frameContext.dt, frameContext);
        }
      });
    });
  }
}

export class FrameScheduler {
  constructor(pipeline) {
    this.pipeline = pipeline;
    this.frameCount = 0;
    this.elapsedTime = 0;
  }

  tick(dt, frameContext) {
    this.frameCount++;
    this.elapsedTime += dt;
    this.pipeline.executeFrame(frameContext);
  }
}
