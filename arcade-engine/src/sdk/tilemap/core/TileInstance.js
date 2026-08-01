export class TileInstance {
  constructor(definition, state = {}) {
    this.definition = definition;
    this.state = state;
    this.visible = true;
    this.rotation = 0;
  }
}
