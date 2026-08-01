import { MemoryStorageProvider } from '../storage/StorageProvider.js';
import { SnapshotManager } from '../snapshots/SnapshotManager.js';
import { Serializer, Deserializer } from '../serialization/Serializer.js';

export class StateDescriptor {
  constructor(name, scope, defaultData) {
    this.name = name;
    this.scope = scope;
    this.defaultData = defaultData;
  }
}

export class StateRegistry {
  constructor() {
    this.descriptors = new Map();
  }

  register(descriptor) {
    this.descriptors.set(descriptor.name, descriptor);
  }
}

export class PersistenceConfiguration {
  constructor(provider = new MemoryStorageProvider()) {
    this.provider = provider;
  }
}

export class PersistenceContext {
  constructor(config = new PersistenceConfiguration()) {
    this.config = config;
  }
}

export class PersistenceManager {
  constructor(provider = new MemoryStorageProvider()) {
    this.provider = provider;
    this.snapshotManager = new SnapshotManager();
    this.stateRegistry = new StateRegistry();
  }

  async saveState(key, data) {
    const serialized = Serializer.serialize(data);
    await this.provider.save(key, serialized);
  }

  async loadState(key) {
    const raw = await this.provider.load(key);
    if (!raw) return null;
    return Deserializer.deserialize(raw);
  }

  async deleteState(key) {
    await this.provider.delete(key);
  }

  takeSnapshot(snapshotId, data) {
    return this.snapshotManager.takeSnapshot(snapshotId, data);
  }
}
