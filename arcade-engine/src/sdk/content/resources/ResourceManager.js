import { AssetRegistry } from '../registry/AssetRegistry.js';
import { CacheManager } from '../cache/CacheManager.js';
import { BundleManager } from './BundleManager.js';
import { ResourceHandle } from './ResourceHandle.js';

export class ResourceManager {
  constructor() {
    this.registry = new AssetRegistry();
    this.cache = new CacheManager();
    this.bundles = new BundleManager();
  }

  async load(urn) {
    const cached = this.cache.get(urn);
    if (cached) {
      this.cache.acquire(urn);
      return cached;
    }

    const desc = this.registry.lookup(urn);
    const handle = new ResourceHandle(desc, null);
    this.cache.set(urn, handle);
    this.cache.acquire(urn);
    return handle;
  }

  release(urn) {
    return this.cache.release(urn);
  }
}
