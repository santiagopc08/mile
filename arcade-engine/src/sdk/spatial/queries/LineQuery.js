import { SpatialQuery } from './SpatialQuery.js';

export class LineQuery extends SpatialQuery {
  static getCellsOnLine(grid, x0, y0, x1, y1) {
    const results = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let currX = x0;
    let currY = y0;

    while (true) {
      const cell = grid.getCell(currX, currY);
      if (cell) results.push(cell);

      if (currX === x1 && currY === y1) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currY += sy;
      }
    }
    return results;
  }
}
