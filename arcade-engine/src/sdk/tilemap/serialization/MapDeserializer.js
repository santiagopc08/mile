import { MapValidator } from './MapValidator.js';
import { TileMap } from '../core/TileMap.js';

export class MapDeserializer {
  static deserialize(jsonString) {
    const raw = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    MapValidator.validate(raw);

    const tileMap = new TileMap(raw.name || 'map', raw.width, raw.height, raw.tileSize || 1);
    return tileMap;
  }
}
