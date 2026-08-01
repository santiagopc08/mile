export class BundleManager {
  constructor() {
    this.bundles = new Map();
  }

  registerBundle(descriptor) {
    this.bundles.set(descriptor.id, descriptor);
  }

  getBundle(bundleId) {
    return this.bundles.get(bundleId) || null;
  }
}
