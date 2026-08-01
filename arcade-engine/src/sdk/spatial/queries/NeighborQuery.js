import { SpatialQuery } from './SpatialQuery.js';

export class NeighborQuery extends SpatialQuery {
  static get4WayNeighbors(grid, x, y) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const results = [];
    dirs.forEach(([dx, dy]) => {
      const cell = grid.getCell(x + dx, y + dy);
      if (cell) results.push(cell);
    });
    return results;
  }

  static get8WayNeighbors(grid, x, y) {
    const dirs = [
      [0, -1], [1, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ];
    const results = [];
    dirs.forEach(([dx, dy]) => {
      const cell = grid.getCell(x + dx, y + dy);
      if (cell) results.push(cell);
    });
    return results;
  }
}
