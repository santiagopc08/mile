export class TileResolver {
  constructor(tileSet) {
    this.tileSet = tileSet;
  }

  resolve(tileId) {
    return this.tileSet ? this.tileSet.getDefinition(tileId) : null;
  }
}
