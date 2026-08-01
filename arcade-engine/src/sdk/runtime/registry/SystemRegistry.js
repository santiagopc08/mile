import { ExecutionStage } from '../pipeline/ExecutionStage.js';

export class SystemDescriptor {
  constructor(name, systemInstance, stage = ExecutionStage.PRE_UPDATE, priority = 100, dependencies = []) {
    this.name = name;
    this.systemInstance = systemInstance;
    this.stage = stage;
    this.priority = priority;
    this.dependencies = dependencies;
    this.enabled = true;
  }
}

export class SystemHandle {
  constructor(descriptor) {
    this.name = descriptor.name;
    this.descriptor = descriptor;
  }
}

export class SystemCollection {
  constructor() {
    this.systems = new Map();
  }

  add(descriptor) { this.systems.set(descriptor.name, descriptor); }
  get(name) { return this.systems.get(name) || null; }
  remove(name) { this.systems.delete(name); }
}

export class SystemRegistry {
  constructor() {
    this.collection = new SystemCollection();
  }

  register(name, systemInstance, stage = ExecutionStage.PRE_UPDATE, priority = 100, dependencies = []) {
    const desc = new SystemDescriptor(name, systemInstance, stage, priority, dependencies);
    this.collection.add(desc);
    return new SystemHandle(desc);
  }

  unregister(name) {
    this.collection.remove(name);
  }

  getByStage(stage) {
    return Array.from(this.collection.systems.values())
      .filter((sys) => sys.stage === stage && sys.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
}
