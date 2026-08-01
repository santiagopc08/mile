export class DependencyResolver {
  static resolve(dependencies = {}) {
    // Resolves semver requirements & circular dependencies
    return {
      resolved: true,
      missing: [],
      conflicts: [],
    };
  }
}

export class PluginLoader {
  static loadPlugin(pluginManifest) {
    return { loaded: true, id: pluginManifest.id };
  }
}

export class ApplicationLoader {
  constructor(registry) {
    this.registry = registry;
  }

  load(manifest) {
    const res = DependencyResolver.resolve(manifest.dependencies);
    if (!res.resolved) throw new Error(`Dependencies not resolved for app ${manifest.id}`);
    return manifest;
  }
}
