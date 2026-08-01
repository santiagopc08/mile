import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { DiagnosticsManager } from '../../diagnostics/core/DiagnosticsManager.js';
import { RuntimeOrchestrator } from './RuntimeOrchestrator.js';
import { SandboxActorFactory, HudFactory } from './SandboxActors.js';
import { SandboxEvents, SandboxState, DomainCapability } from './SandboxEvents.js';
import { AudioCueComponent } from './SandboxComponents.js';

export class SandboxWorld {
  constructor() {
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();
    this.diagnosticsManager = new DiagnosticsManager();
    this.orchestrator = new RuntimeOrchestrator(null);

    // Primary Scene Actors
    this.camera = null;
    this.player = null;
    this.vehicle = null;
    this.npc = null;
    this.light = null;
    this.hud = null;

    // State
    this.state = SandboxState.SIMULATION;
    this.frameCount = 0;

    // Audio Log
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    // 1. Create Base Scene Actors
    this.camera = SandboxActorFactory.createCamera(0, 0);
    this.player = SandboxActorFactory.createPlayer(0, 0);
    this.vehicle = SandboxActorFactory.createVehicle(5, 0);
    this.npc = SandboxActorFactory.createNPC(-5, 0);
    this.light = SandboxActorFactory.createLight(0, 10);
    this.hud = HudFactory.create();

    this.actorRegistry.register(this.camera);
    this.actorRegistry.register(this.player);
    this.actorRegistry.register(this.vehicle);
    this.actorRegistry.register(this.npc);
    this.actorRegistry.register(this.light);
    this.actorRegistry.register(this.hud);

    this.state = SandboxState.SIMULATION;
  }

  // ──────────── Capability Management ────────────

  enableCapability(domain) {
    this.orchestrator.enableDomain(domain);
    this.eventBus.emit(SandboxEvents.CAPABILITY_ENABLED, { domain });
    this._audio('capability_enable');
  }

  disableCapability(domain) {
    this.orchestrator.disableDomain(domain);
    this.eventBus.emit(SandboxEvents.CAPABILITY_DISABLED, { domain });
    this._audio('capability_disable');
  }

  hotReloadDomain(domain) {
    const success = this.orchestrator.hotReloadDomain(domain);
    if (success) {
      this.eventBus.emit(SandboxEvents.CAPABILITY_ENABLED, { domain, hotReloaded: true });
      this._audio('hot_reload');
    }
    return success;
  }

  // ──────────── Plugin Integration ────────────

  loadPlugin(pluginId, pluginName) {
    const plugin = this.orchestrator.loadPlugin(pluginId, pluginName);
    this.eventBus.emit(SandboxEvents.PLUGIN_LOADED, { pluginId, pluginName });
    this._audio('plugin_load');
    return plugin;
  }

  unloadPlugin(pluginId) {
    const success = this.orchestrator.unloadPlugin(pluginId);
    if (success) {
      this.eventBus.emit(SandboxEvents.PLUGIN_UNLOADED, { pluginId });
      this._audio('plugin_unload');
    }
    return success;
  }

  // ──────────── Dynamic Actor & Component Mutation ────────────

  spawnPropActor(id, name, x, y) {
    const prop = SandboxActorFactory.createProp(id, name, x, y);
    this.actorRegistry.register(prop);
    this.eventBus.emit(SandboxEvents.ACTOR_CREATED, { actorId: id, name });
    return prop;
  }

  destroyActor(actorId) {
    const actor = this.actorRegistry.get(actorId);
    if (actor) {
      this.actorRegistry.unregister(actorId);
      this.eventBus.emit(SandboxEvents.ACTOR_DESTROYED, { actorId });
      return true;
    }
    return false;
  }

  addComponentToActor(actorId, component) {
    const actor = this.actorRegistry.get(actorId);
    if (actor) {
      actor.addComponent(component);
      this.eventBus.emit(SandboxEvents.COMPONENT_ADDED, { actorId, componentName: component.name });
      return true;
    }
    return false;
  }

  removeComponentFromActor(actorId, componentName) {
    const actor = this.actorRegistry.get(actorId);
    if (actor && actor.getComponent(componentName)) {
      actor.removeComponent(componentName);
      this.eventBus.emit(SandboxEvents.COMPONENT_REMOVED, { actorId, componentName });
      return true;
    }
    return false;
  }

  // ──────────── State Control ────────────

  setState(newState) {
    this.state = newState;
    if (newState === SandboxState.PAUSED) {
      this.eventBus.emit(SandboxEvents.GAME_PAUSED, {});
    } else if (newState === SandboxState.SIMULATION) {
      this.eventBus.emit(SandboxEvents.GAME_RESUMED, {});
    }
  }

  stepSingleFrame(dt = 0.016) {
    if (this.state === SandboxState.PAUSED || this.state === SandboxState.STEP) {
      this.update(dt);
    }
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === SandboxState.PAUSED) return;

    this.frameCount++;

    // Update HUD metrics
    const status = this.hud.getComponent('GameStatusComponent');
    if (status) {
      status.activeActorsCount = this.actorRegistry.collection.actors.size;
      status.activeCapabilitiesCount = this.orchestrator.registry.getActiveCapabilities().length;
      status.loadedPluginsCount = this.orchestrator.plugins.size;
    }

    // Consume Audio
    this._consumeAudio();

    // Actor Component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  _audio(cue) {
    this.audioLog.push(cue);
  }

  _consumeAudio() {
    const audio = this.player ? this.player.getComponent('AudioCueComponent') : null;
    if (audio) {
      const cue = audio.consume();
      if (cue) this._audio(cue);
    }
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.audioLog = [];
    this.frameCount = 0;
    this.initialize();
  }
}
