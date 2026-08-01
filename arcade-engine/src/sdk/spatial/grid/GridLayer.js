export class GridLayer {
  constructor(name = 'default') {
    this.name = name;
    this.occupants = new Set();
  }
}
