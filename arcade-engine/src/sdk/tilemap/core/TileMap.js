import { GroundLayer } from '../layers/GroundLayer.js';
import { CollisionLayer } from '../layers/GroundLayer.js';
import { GameplayLayer } from '../layers/GameplayLayer.js';

export class TileMap {
  constructor(name = 'map', width = 28, height = 36, tileSize = 1) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.layers = new Map();

    this.addLayer(new GroundLayer(width, height));
    this.addLayer(new CollisionLayer(width, height));
    this.addLayer(new GameplayLayer(width, height));
  }

  addLayer(layer) {
    this.layers.set(layer.name, layer);
  }

  getLayer(layerName) {
    return this.layers.get(layerName) || null;
  }
}
