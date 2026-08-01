export class CellIndex {
  constructor() {
    this.index = new Map();
  }

  insert(key, cell) {
    this.index.set(key, cell);
  }

  lookup(key) {
    return this.index.get(key) || null;
  }
}
