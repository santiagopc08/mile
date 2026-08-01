import { Bounds } from '../../spatial/core/Bounds.js';

export class CollisionShape {
  constructor(x = 0, y = 0, width = 1, height = 1) {
    this.bounds = new Bounds(x, y, width, height);
  }
}
