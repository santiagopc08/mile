export class PlatformMetrics {
  constructor() {
    this.totalAppsInstalled = 0;
    this.totalPluginsLoaded = 0;
  }
}

export class PlatformProfiler {
  constructor(manager) {
    this.manager = manager;
    this.metrics = new PlatformMetrics();
  }

  getReport() {
    return {
      installedApps: this.manager ? this.manager.registry.collection.lookup.index.size : 0,
      activeApps: this.manager ? this.manager.activeApps.size : 0,
    };
  }
}
