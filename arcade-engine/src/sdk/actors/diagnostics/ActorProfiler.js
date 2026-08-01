export class ActorMetrics {
  constructor() {
    this.totalSpawned = 0;
    this.totalDestroyed = 0;
  }
}

export class ActorProfiler {
  constructor(registry) {
    this.registry = registry;
    this.metrics = new ActorMetrics();
  }

  getReport() {
    return {
      activeActorsCount: this.registry ? this.registry.collection.actors.size : 0,
    };
  }
}
