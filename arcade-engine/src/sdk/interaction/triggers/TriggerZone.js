import { Bounds } from '../../spatial/core/Bounds.js';

export class Trigger {
  constructor(id, bounds) {
    this.id = id;
    this.bounds = bounds;
    this.active = true;
    this.occupants = new Set();
  }
}

export class TriggerZone extends Trigger {
  constructor(id, x, y, width, height, eventName) {
    super(id, new Bounds(x, y, width, height));
    this.eventName = eventName;
  }
}

export class TriggerCollection {
  constructor() {
    this.triggers = new Map();
  }

  add(trigger) { this.triggers.set(trigger.id, trigger); }
  remove(id) { this.triggers.delete(id); }
}
