import { Bounds } from '../core/Bounds.js';

export class GridRegion {
  constructor(id, x, y, width, height) {
    this.id = id;
    this.bounds = new Bounds(x, y, width, height);
    this.metadata = {};
  }
}
