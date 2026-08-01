export class TileMapMetrics {
  constructor() {
    this.totalTiles = 0;
    this.totalLayers = 0;
  }
}

export class TileMapProfiler {
  constructor(tileMap) {
    this.tileMap = tileMap;
    this.metrics = new TileMapMetrics();
  }

  getReport() {
    return {
      name: this.tileMap ? this.tileMap.name : 'none',
      width: this.tileMap ? this.tileMap.width : 0,
      height: this.tileMap ? this.tileMap.height : 0,
      layerCount: this.tileMap ? this.tileMap.layers.size : 0,
    };
  }
}
