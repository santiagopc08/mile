import { WorldPosition } from './WorldPosition.js';
import { GridPosition } from './GridPosition.js';
import { TilePosition } from './TilePosition.js';

export class Conversion {
  static worldToGrid(worldPos, tileSize = 1) {
    const gx = Math.floor(worldPos.x / tileSize);
    const gy = Math.floor(worldPos.y / tileSize);
    return new GridPosition(gx, gy);
  }

  static gridToWorld(gridPos, tileSize = 1) {
    const wx = (gridPos.x + 0.5) * tileSize;
    const wy = (gridPos.y + 0.5) * tileSize;
    return new WorldPosition(wx, wy);
  }

  static gridToTile(gridPos) {
    return new TilePosition(gridPos.x, gridPos.y);
  }

  static tileToGrid(tilePos) {
    return new GridPosition(tilePos.x, tilePos.y);
  }
}
