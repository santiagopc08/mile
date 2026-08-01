import { Tile } from '../core/Tile.js';

export class TileLayer {
  constructor(name = 'layer', width = 28, height = 36) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.grid = new Array(width * height);
    this.visible = true;
    this.opacity = 1.0;
  }

  setTile(x, y, tileDefinition) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.grid[y * this.width + x] = new Tile(x, y, tileDefinition);
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.grid[y * this.width + x] || null;
  }
}
