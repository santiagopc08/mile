import { SpatialQuery } from './SpatialQuery.js';

export class AreaQuery extends SpatialQuery {
  static getCellsInArea(grid, minX, minY, maxX, maxY) {
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
