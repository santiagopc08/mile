import { ActorComponent } from '../../actors/components/ActorComponent.js';

export class BehaviorComponent extends ActorComponent {
  constructor(pipeline = null) {
    super('BehaviorComponent');
    this.pipeline = pipeline;
  }

  onUpdate(dt) {
    if (this.pipeline && !this.pipeline.completed) {
      this.pipeline.execute({ actor: this.owner });
    }
  }
}

export class BehaviorRegistry {
  constructor() {
    this.pipelines = new Map();
  }
}

export class BehaviorSystem {
  constructor() {
    this.registry = new BehaviorRegistry();
  }
}
