export class PersistentCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    return this.store.get(key) || null;
  }

  set(key, value) {
    this.store.set(key, value);
  }

  has(key) {
    return this.store.has(key);
  }

  remove(key) {
    this.store.delete(key);
  }
}
