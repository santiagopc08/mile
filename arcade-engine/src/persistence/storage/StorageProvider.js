export class StorageProvider {
  async save(key, value) {}
  async load(key) { return null; }
  async delete(key) {}
  async clear() {}
}

export class MemoryStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.storage = new Map();
  }

  async save(key, value) { this.storage.set(key, value); }
  async load(key) { return this.storage.get(key) || null; }
  async delete(key) { this.storage.delete(key); }
  async clear() { this.storage.clear(); }
}

export class FileStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.memoryFallback = new MemoryStorageProvider();
  }

  async save(key, value) { await this.memoryFallback.save(key, value); }
  async load(key) { return await this.memoryFallback.load(key); }
}

export class IndexedDbStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.memoryFallback = new MemoryStorageProvider();
  }

  async save(key, value) { await this.memoryFallback.save(key, value); }
  async load(key) { return await this.memoryFallback.load(key); }
}

export class CloudStorageProvider extends StorageProvider {}
