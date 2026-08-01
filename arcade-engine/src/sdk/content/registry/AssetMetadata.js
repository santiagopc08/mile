export class AssetMetadata {
  constructor(data = {}) {
    this._data = new Map(Object.entries(data));
  }

  get(key, defaultValue = undefined) {
    return this._data.has(key) ? this._data.get(key) : defaultValue;
  }

  set(key, value) {
    this._data.set(key, value);
  }

  has(key) {
    return this._data.has(key);
  }

  toObject() {
    return Object.fromEntries(this._data);
  }
}
