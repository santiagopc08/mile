export const SimulationEvents = Object.freeze({
  ENTITY_CREATED: 'Simulation.EntityCreated',
  ENTITY_DELETED: 'Simulation.EntityDeleted',
  SELECTION_CHANGED: 'Simulation.SelectionChanged',
  SCENE_LOADED: 'Simulation.SceneLoaded',
  SCENE_SAVED: 'Simulation.SceneSaved',
  UNDO: 'Simulation.Undo',
  REDO: 'Simulation.Redo',
  PLUGIN_LOADED: 'Simulation.PluginLoaded',
  GAME_PAUSED: 'Simulation.GamePaused',
  GAME_RESUMED: 'Simulation.GameResumed',
});

export const SimulationState = Object.freeze({
  EDITING: 'EDITING',
  SIMULATION: 'SIMULATION',
  PAUSED: 'PAUSED',
  PROFILING: 'PROFILING',
});
