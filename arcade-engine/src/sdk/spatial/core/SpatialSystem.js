import { Grid } from '../grid/Grid.js';
import { SpatialIndex } from '../indexing/SpatialIndex.js';
import { CoordinateSystem } from './CoordinateSystem.js';

export class SpatialSystem {
  constructor(width = 28, height = 36, tileSize = 1) {
    this.grid = new Grid(width, height, tileSize);
    this.index = new SpatialIndex();
    this.coordSystem = new CoordinateSystem(tileSize);
  }
}
