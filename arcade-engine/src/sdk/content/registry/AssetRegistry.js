import { ValidationError } from '../../core/errors/SDKError.js';

export class AssetRegistry {
  constructor() {
    this.assetsByURN = new Map();
    this.assetsByUUID = new Map();
  }

  register(descriptor) {
    if (!descriptor || !descriptor.urn) {
      throw new ValidationError('AssetDescriptor must possess a valid URN.');
    }
    this.assetsByURN.set(descriptor.urn, descriptor);
    this.assetsByUUID.set(descriptor.uuid, descriptor);
    return descriptor;
  }

  unregister(urn) {
    if (this.assetsByURN.has(urn)) {
      const desc = this.assetsByURN.get(urn);
      this.assetsByUUID.delete(desc.uuid);
      this.assetsByURN.delete(urn);
    }
  }

  lookup(urn) {
    return this.assetsByURN.get(urn) || null;
  }

  lookupByUUID(uuid) {
    return this.assetsByUUID.get(uuid) || null;
  }

  query(predicate) {
    const results = [];
    this.assetsByURN.forEach((desc) => {
      if (predicate(desc)) results.push(desc);
    });
    return results;
  }

  clear() {
    this.assetsByURN.clear();
    this.assetsByUUID.clear();
  }
}
