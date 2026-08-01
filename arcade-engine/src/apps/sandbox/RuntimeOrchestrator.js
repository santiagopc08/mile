import { CapabilityRegistry } from './CapabilityRegistry.js';
import { DomainCapability } from './SandboxEvents.js';

export class PluginDescriptor {
  constructor(id, name, version = '1.0.0') {
    this.id = id;
    this.name = name;
    this.version = version;
    this.loaded = false;
    this.systems = [];
  }
}

/**
 * RuntimeOrchestrator — coordinates active runtime domains, plugins, and step-by-step simulation.
 */
export class RuntimeOrchestrator {
  constructor(runtime) {
    this.runtime = runtime;
    this.registry = new CapabilityRegistry();
    this.plugins = new Map();
    this.hotReloadCount = 0;
  }

  enableDomain(domain) {
    this.registry.enable(domain);
  }

  disableDomain(domain) {
    this.registry.disable(domain);
  }

  loadPlugin(pluginId, pluginName) {
    const plugin = new PluginDescriptor(pluginId, pluginName);
    plugin.loaded = true;
    this.plugins.set(pluginId, plugin);
    return plugin;
  }

  unloadPlugin(pluginId) {
    if (this.plugins.has(pluginId)) {
      const plugin = this.plugins.get(pluginId);
      plugin.loaded = false;
      this.plugins.delete(pluginId);
      return true;
    }
    return false;
  }

  hotReloadDomain(domain) {
    if (this.registry.isEnabled(domain)) {
      this.hotReloadCount++;
      // Simulate hot-reloading domain system bindings without destroying runtime
      this.registry.disable(domain);
      this.registry.enable(domain);
      return true;
    }
    return false;
  }

  stepSingleFrame(dt = 0.016, world) {
    if (world) {
      world.update(dt);
    }
  }
}
