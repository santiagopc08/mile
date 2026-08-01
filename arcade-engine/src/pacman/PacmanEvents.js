/**
 * Pac-Man Event Names for Engine EventBus.
 *
 * Cuidado al editar: EventBus indexa por el valor de la clave, así que una
 * clave inexistente emite sobre el canal `undefined`. Todos los emits con
 * claves faltantes acaban en el mismo bucket y los handlers reciben payloads
 * ajenos, sin que se lance ningún error. tests/pacman/ConfigIntegrity.test.js
 * verifica que toda clave leída en el código exista aquí.
 */
export const PacmanEvents = Object.freeze({
  // Infraestructura del plugin
  PACMAN_LOADED: 'PacmanLoaded',
  PACMAN_STARTED: 'PacmanStarted',
  PACMAN_DESTROYED: 'PacmanDestroyed',
  MAP_LOADED: 'MapLoaded',
  ASSETS_LOADED: 'AssetsLoaded',

  // Gameplay
  PELLET_COLLECTED: 'PelletCollected',
  POWER_PELLET_COLLECTED: 'PowerPelletCollected',
  GHOST_KILLED: 'GhostKilled',
  PACMAN_KILLED: 'PacmanKilled',
  FRUIT_COLLECTED: 'FruitCollected',
  EXTRA_LIFE: 'ExtraLife',
  GHOST_STATE_CHANGED: 'GhostStateChanged',
  LEVEL_COMPLETED: 'LevelCompleted',
  GAME_OVER: 'GameOver',
  SCORE_CHANGED: 'ScoreChanged',
  HIGH_SCORE_CHANGED: 'HighScoreChanged',
  LIVES_CHANGED: 'LivesChanged',
  LEVEL_CHANGED: 'LevelChanged',
});
