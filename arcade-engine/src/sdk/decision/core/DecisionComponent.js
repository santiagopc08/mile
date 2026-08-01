import { ActorComponent } from '../../actors/components/ActorComponent.js';

export class DecisionModel {
  evaluate(context) {}
}

export class DecisionComponent extends ActorComponent {
  constructor(model = null) {
    super('DecisionComponent');
    this.model = model;
  }

  onUpdate(dt) {
    if (this.model && typeof this.model.update === 'function') {
      this.model.update(dt, this.owner ? this.owner.context : null);
    }
  }
}

export class DecisionRegistry {
  constructor() {
    this.models = new Map();
  }
}

export class DecisionSystem {
  constructor() {
    this.registry = new DecisionRegistry();
  }
}
