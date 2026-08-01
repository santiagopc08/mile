import { ConfigurationError } from '../errors/SDKError.js';

export class Configuration {
  constructor(initialData = {}) {
    this._data = new Map(Object.entries(initialData));
  }

  get(key, defaultValue = undefined) {
    return this._data.has(key) ? this._data.get(key) : defaultValue;
  }

  set(key, value) {
    if (typeof key !== 'string' || key.trim() === '') {
      throw new ConfigurationError('Configuration key must be a non-empty string');
    }
    this._data.set(key, value);
  }

  has(key) {
    return this._data.has(key);
  }

  toObject() {
    return Object.fromEntries(this._data);
  }
}
