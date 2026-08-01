export class DependencyResolver {
  static resolve(descriptors = []) {
    // Topological sort by dependencies & priority
    const sorted = [...descriptors];
    sorted.sort((a, b) => a.priority - b.priority);
    return sorted;
  }
}

export class ExecutionOrder {
  static computeOrder(registry, stage) {
    const descriptors = registry.getByStage(stage);
    return DependencyResolver.resolve(descriptors);
  }
}

export class SystemScheduler {
  constructor(registry) {
    this.registry = registry;
  }

  getScheduleForStage(stage) {
    return ExecutionOrder.computeOrder(this.registry, stage);
  }
}
