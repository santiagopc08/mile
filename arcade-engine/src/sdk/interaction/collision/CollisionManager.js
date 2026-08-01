import { CollisionMask } from './CollisionMask.js';

export class CollisionManager {
  static checkTileCollision(grid, x, y, layerName = 'collision') {
    const cell = grid.getCell(Math.floor(x), Math.floor(y));
    if (!cell) return true; // Out of bounds is solid
    const occupants = cell.getLayer(layerName);
    return occupants.size > 0;
  }

  static checkOverlap(shapeA, shapeB) {
    return shapeA.bounds.intersects(shapeB.bounds);
  }
}
