import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { SandboxWorld } from './SandboxWorld.js';

/**
 * SandboxApp — RG-009 Reference Application.
 * Validates dynamic capability composition, plugin integration, domain hot-reloading, and runtime diagnostics.
 */
export class SandboxApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_009_sandbox',
        name: 'RG-009 Sandbox Reference Application',
        version: '1.0.0',
        description: 'Capability Composition & Runtime Orchestration reference platform built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new SandboxWorld();
    this.world.initialize();

    this.runtime.registerSystem('SandboxWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  // Capability Orchestration API
  enableCapability(domain) { if (this.world) this.world.enableCapability(domain); }
  disableCapability(domain) { if (this.world) this.world.disableCapability(domain); }
  hotReloadDomain(domain) { return this.world ? this.world.hotReloadDomain(domain) : false; }

  // Plugin API
  loadPlugin(pluginId, pluginName) { return this.world ? this.world.loadPlugin(pluginId, pluginName) : null; }
  unloadPlugin(pluginId) { return this.world ? this.world.unloadPlugin(pluginId) : false; }

  // Actor / Component Mutation API
  spawnPropActor(id, name, x, y) { return this.world ? this.world.spawnPropActor(id, name, x, y) : null; }
  destroyActor(actorId) { return this.world ? this.world.destroyActor(actorId) : false; }
  addComponentToActor(actorId, component) { return this.world ? this.world.addComponentToActor(actorId, component) : false; }
  removeComponentFromActor(actorId, componentName) { return this.world ? this.world.removeComponentFromActor(actorId, componentName) : false; }

  // Simulation Controls
  setState(state) { if (this.world) this.world.setState(state); }
  stepSingleFrame(dt) { if (this.world) this.world.stepSingleFrame(dt); }
  restart() { if (this.world) this.world.restart(); }

  tick(dt = 0.016) {
    this.runtime.tick(dt);

    if (this.world) {
      const renderView = new RenderView(this.world.viewportManager.mainViewport);
      renderView.visibleActors = Array.from(
        this.world.actorRegistry.collection.actors.values()
      );
      this.renderingSystem.render(renderView);
    }
  }
}
