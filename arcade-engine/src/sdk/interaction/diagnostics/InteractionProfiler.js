export class InteractionMetrics {
  constructor() {
    this.totalCollisionsChecked = 0;
    this.totalTriggersActivated = 0;
  }
}

export class InteractionProfiler {
  constructor(interactionSystem) {
    this.interactionSystem = interactionSystem;
    this.metrics = new InteractionMetrics();
  }

  getReport() {
    return {
      activeTriggers: this.interactionSystem ? this.interactionSystem.manager.triggers.triggers.size : 0,
    };
  }
}
