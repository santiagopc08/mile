export class PersistenceMetrics {
  constructor() {
    this.totalSaves = 0;
    this.totalLoads = 0;
  }
}

export class PersistenceProfiler {
  constructor(manager) {
    this.manager = manager;
    this.metrics = new PersistenceMetrics();
  }

  getReport() {
    return {
      snapshotsCount: this.manager ? this.manager.snapshotManager.snapshots.size : 0,
    };
  }
}
