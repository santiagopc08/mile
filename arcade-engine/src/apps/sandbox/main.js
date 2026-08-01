import { SandboxApp } from './SandboxApp.js';
import { SandboxEvents, SandboxState, DomainCapability } from './SandboxEvents.js';
import { CustomScriptComponent } from './SandboxComponents.js';

/**
 * RG-009 — Sandbox Reference Application runner.
 *
 * Simulates orchestration:
 *  - Toggles domain capabilities dynamically (Physics, Navigation, Cognition, etc.)
 *  - Performs dynamic actor creation, component addition/removal, and actor destruction
 *  - Loads, tests, and unloads dynamic plugins
 *  - Executes domain hot reloading
 *  - Verifies runtime state transitions (Editing, Simulation, Paused, Step, Profiling)
 */
export function runSandboxApp() {
  const app = new SandboxApp();
  app.initialize();

  const events = [];
  const allEvents = [
    SandboxEvents.CAPABILITY_ENABLED,
    SandboxEvents.CAPABILITY_DISABLED,
    SandboxEvents.ACTOR_CREATED,
    SandboxEvents.ACTOR_DESTROYED,
    SandboxEvents.COMPONENT_ADDED,
    SandboxEvents.COMPONENT_REMOVED,
    SandboxEvents.PLUGIN_LOADED,
    SandboxEvents.PLUGIN_UNLOADED,
    SandboxEvents.GAME_PAUSED,
    SandboxEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.016;
  const MAX_TICKS = 100;
  let ticks = 0;

  while (ticks < MAX_TICKS) {
    // 1. Dynamic Actor Creation
    if (ticks === 10) {
      app.spawnPropActor('prop_tree_01', 'Tree', 12, 0);
      app.spawnPropActor('prop_rock_01', 'Rock', -8, 2);
    }

    // 2. Dynamic Component Addition & Removal
    if (ticks === 20) {
      app.addComponentToActor('player_sandbox', new CustomScriptComponent('PlayerMovementScript'));
    }
    if (ticks === 30) {
      app.removeComponentFromActor('player_sandbox', 'CustomScriptComponent');
    }

    // 3. Domain Capability Toggle
    if (ticks === 40) {
      app.disableCapability(DomainCapability.PHYSICS);
    }
    if (ticks === 50) {
      app.enableCapability(DomainCapability.PHYSICS);
    }

    // 4. Plugin Loading & Unloading
    if (ticks === 60) {
      app.loadPlugin('plugin_weather_sys', 'WeatherSystemPlugin');
    }
    if (ticks === 70) {
      app.unloadPlugin('plugin_weather_sys');
    }

    // 5. Domain Hot Reloading
    if (ticks === 80) {
      app.hotReloadDomain(DomainCapability.RENDERING);
    }

    // 6. State Switching & Single-Stepping
    if (ticks === 90) app.setState(SandboxState.PAUSED);
    if (ticks === 92) app.stepSingleFrame(DT);
    if (ticks === 95) app.setState(SandboxState.SIMULATION);

    app.tick(DT);
    ticks++;
  }

  app.stop();

  const status = app.world.hud.getComponent('GameStatusComponent');

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    activeActorsCount: status ? status.activeActorsCount : 0,
    activeCapabilitiesCount: status ? status.activeCapabilitiesCount : 0,
    loadedPluginsCount: status ? status.loadedPluginsCount : 0,
    hotReloadsExecuted: app.world.orchestrator.hotReloadCount,
    actorsCreated: events.filter((e) => e.event === SandboxEvents.ACTOR_CREATED).length,
    componentsAdded: events.filter((e) => e.event === SandboxEvents.COMPONENT_ADDED).length,
    componentsRemoved: events.filter((e) => e.event === SandboxEvents.COMPONENT_REMOVED).length,
    pluginsLoaded: events.filter((e) => e.event === SandboxEvents.PLUGIN_LOADED).length,
    pluginsUnloaded: events.filter((e) => e.event === SandboxEvents.PLUGIN_UNLOADED).length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
