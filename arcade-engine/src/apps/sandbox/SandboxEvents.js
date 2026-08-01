export const SandboxEvents = Object.freeze({
  CAPABILITY_ENABLED: 'Sandbox.CapabilityEnabled',
  CAPABILITY_DISABLED: 'Sandbox.CapabilityDisabled',
  ACTOR_CREATED: 'Sandbox.ActorCreated',
  ACTOR_DESTROYED: 'Sandbox.ActorDestroyed',
  COMPONENT_ADDED: 'Sandbox.ComponentAdded',
  COMPONENT_REMOVED: 'Sandbox.ComponentRemoved',
  PLUGIN_LOADED: 'Sandbox.PluginLoaded',
  PLUGIN_UNLOADED: 'Sandbox.PluginUnloaded',
  SCENE_SAVED: 'Sandbox.SceneSaved',
  SCENE_LOADED: 'Sandbox.SceneLoaded',
  GAME_PAUSED: 'Sandbox.GamePaused',
  GAME_RESUMED: 'Sandbox.GameResumed',
});

export const SandboxState = Object.freeze({
  EDITING: 'EDITING',
  SIMULATION: 'SIMULATION',
  PAUSED: 'PAUSED',
  STEP: 'STEP',
  PROFILING: 'PROFILING',
});

export const DomainCapability = Object.freeze({
  PHYSICS: 'PHYSICS',
  NAVIGATION: 'NAVIGATION',
  COGNITION: 'COGNITION',
  TERRAIN: 'TERRAIN',
  RENDERING: 'RENDERING',
  AUDIO: 'AUDIO',
  PERSISTENCE: 'PERSISTENCE',
  DIAGNOSTICS: 'DIAGNOSTICS',
  PLUGINS: 'PLUGINS',
});
