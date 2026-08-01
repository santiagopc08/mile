import { MemoryCache } from './MemoryCache.js';
import { PersistentCache } from './PersistentCache.js';
import { ReferenceCounter } from './ReferenceCounter.js';

export class CacheManager {
  constructor() {
    this.memory = new MemoryCache();
    this.persistent = new PersistentCache();
    this.refCounter = new ReferenceCounter();
  }

  get(key) {
    return this.memory.get(key) || this.persistent.get(key);
  }

  set(key, value, persistent = false) {
    this.memory.set(key, value);
    if (persistent) {
      this.persistent.set(key, value);
    }
  }

  acquire(key) {
    return this.refCounter.acquire(key);
  }

  release(key) {
    const remaining = this.refCounter.release(key);
    if (remaining === 0) {
      this.memory.remove(key);
    }
    return remaining;
  }
}
