/**
 * Pac-Man Event Names for Engine EventBus.
 */
export const PacmanEvents = Object.freeze({
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
