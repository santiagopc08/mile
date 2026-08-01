import { TileInstance } from './TileInstance.js';

export class Tile {
  constructor(x, y, definition) {
    this.x = x;
    this.y = y;
    this.instance = new TileInstance(definition);
  }
}
