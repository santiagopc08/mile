import { SpatialMetrics } from './SpatialMetrics.js';

export class SpatialProfiler {
  constructor(spatialSystem) {
    this.spatialSystem = spatialSystem;
    this.metrics = new SpatialMetrics();
  }

  getReport() {
    return {
      gridWidth: this.spatialSystem ? this.spatialSystem.grid.width : 0,
      gridHeight: this.spatialSystem ? this.spatialSystem.grid.height : 0,
      totalCells: this.spatialSystem ? this.spatialSystem.grid.cells.length : 0,
    };
  }
}
