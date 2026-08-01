import { RenderQueue } from '../layers/RenderQueue.js';
import { DrawCommand } from '../commands/RenderCommand.js';

export class RenderView {
  constructor(viewport = null) {
    this.viewport = viewport;
    this.visibleActors = [];
  }
}

export class RenderPipeline {
  constructor() {
    this.queue = new RenderQueue();
  }

  generateCommands(renderView) {
    this.queue.clear();
    if (!renderView) return this.queue;

    renderView.visibleActors.forEach((actor) => {
      const presentation = actor.getComponent('PresentationComponent');
      const transform = actor.getComponent('TransformComponent');
      const sprite = actor.getComponent('SpriteComponent');

      if (presentation && presentation.visible && transform) {
        const cmd = new DrawCommand(sprite, presentation, transform, presentation.sortingOrder);
        this.queue.add(cmd);
      }
    });

    this.queue.sort();
    return this.queue;
  }
}

export class RenderingConfiguration {
  constructor(adapter = null) {
    this.adapter = adapter;
  }
}

export class RenderingContext {
  constructor(config = new RenderingConfiguration()) {
    this.config = config;
  }
}

export class RenderingSystem {
  constructor(adapter = null) {
    this.adapter = adapter;
    this.pipeline = new RenderPipeline();
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  render(renderView) {
    if (!this.adapter) return;
    const queue = this.pipeline.generateCommands(renderView);
    this.adapter.submitCommands(queue);
    this.adapter.presentFrame();
  }

  update(dt, frameContext) {}
}
