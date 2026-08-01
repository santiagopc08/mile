import { SpatialQuery } from './SpatialQuery.js';

export class RadiusQuery extends SpatialQuery {
  static getCellsInRadius(grid, cx, cy, radius) {
    const results = [];
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(grid.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(grid.height - 1, Math.ceil(cy + radius));

    const r2 = radius * radius;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          const cell = grid.getCell(x, y);
          if (cell) results.push(cell);
        }
      }
    }
    return results;
  }
}
