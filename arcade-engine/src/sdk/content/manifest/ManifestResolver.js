export class ManifestResolver {
  static resolveDependencies(assetRegistry, rootUrn) {
    const visited = new Set();
    const resolvedOrder = [];

    function traverse(urn) {
      if (visited.has(urn)) return;
      visited.add(urn);

      const desc = assetRegistry.lookup(urn);
      if (desc && desc.dependencies) {
        desc.dependencies.forEach((depUrn) => traverse(depUrn));
      }
      if (desc) resolvedOrder.push(desc);
    }

    traverse(rootUrn);
    return resolvedOrder;
  }
}
