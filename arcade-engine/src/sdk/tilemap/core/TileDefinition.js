export class TileDefinition {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `tile_${id}`;
    this.type = options.type || 'DEFAULT';
    this.isSolid = options.isSolid || false;
    this.cost = options.cost != null ? options.cost : 1.0;
    this.tags = options.tags || [];
    this.properties = options.properties || {};
  }
}
