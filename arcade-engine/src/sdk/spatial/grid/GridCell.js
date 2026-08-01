import { GridPosition } from '../coordinates/GridPosition.js';

export class GridCell {
  constructor(x, y) {
    this.id = `cell_${x}_${y}`;
    this.position = new GridPosition(x, y);
    this.layers = new Map();
    this.flags = 0;
    this.metadata = {};
  }

  getLayer(layerName) {
    if (!this.layers.has(layerName)) {
      this.layers.set(layerName, new Set());
    }
    return this.layers.get(layerName);
  }

  addOccupant(layerName, occupant) {
    this.getLayer(layerName).add(occupant);
  }

  removeOccupant(layerName, occupant) {
    if (this.layers.has(layerName)) {
      this.layers.get(layerName).delete(occupant);
    }
  }
}
