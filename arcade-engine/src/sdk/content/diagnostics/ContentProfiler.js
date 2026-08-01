import { ResourceMetrics } from './ResourceMetrics.js';

export class ContentProfiler {
  constructor(resourceManager) {
    this.resourceManager = resourceManager;
    this.metrics = new ResourceMetrics();
  }

  getReport() {
    return {
      registeredAssets: this.resourceManager ? this.resourceManager.registry.assetsByURN.size : 0,
      activeHandles: this.resourceManager ? this.resourceManager.cache.memory.cache.size : 0,
    };
  }
}
