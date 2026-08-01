export class TileSet {
  constructor(name = 'default_tileset') {
    this.name = name;
    this.definitions = new Map();
  }

  addDefinition(definition) {
    this.definitions.set(definition.id, definition);
  }

  getDefinition(id) {
    return this.definitions.get(id) || null;
  }
}
