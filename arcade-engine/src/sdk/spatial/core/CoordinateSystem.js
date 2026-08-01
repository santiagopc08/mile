export class CoordinateSystem {
  constructor(tileSize = 1) {
    this.tileSize = tileSize;
  }

  setTileSize(size) {
    this.tileSize = size;
  }
}
