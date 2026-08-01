import { SpatialQuery } from './SpatialQuery.js';

export class BoundsQuery extends SpatialQuery {
  static getCellsInBounds(grid, bounds) {
    const minX = Math.max(0, Math.floor(bounds.x));
    const minY = Math.max(0, Math.floor(bounds.y));
    const maxX = Math.min(grid.width - 1, Math.floor(bounds.x + bounds.width));
    const maxY = Math.min(grid.height - 1, Math.floor(bounds.y + bounds.height));

    const results = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = grid.getCell(x, y);
        if (cell) results.push(cell);
      }
    }
    return results;
  }
}
