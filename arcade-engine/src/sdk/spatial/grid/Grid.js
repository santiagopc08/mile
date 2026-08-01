import { GridBounds } from './GridBounds.js';
import { GridCell } from './GridCell.js';

export class Grid {
  constructor(width = 28, height = 36, tileSize = 1) {
    this.bounds = new GridBounds(width, height);
    this.tileSize = tileSize;
    this.cells = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.cells[y * width + x] = new GridCell(x, y);
      }
    }
  }

  getCell(x, y) {
    if (!this.bounds.isInside(x, y)) return null;
    return this.cells[y * this.bounds.width + x];
  }

  get width() {
    return this.bounds.width;
  }

  get height() {
    return this.bounds.height;
  }
}
