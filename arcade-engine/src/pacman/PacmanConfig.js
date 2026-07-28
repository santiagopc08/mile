/**
 * Classic Pac-Man Rules & Balancing Config.
 */
export const PacmanConfig = Object.freeze({
  GRID_SIZE: 1.0,
  GRID_WIDTH: 28,
  GRID_HEIGHT: 31,
  ORIGIN_X: -13.5,
  ORIGIN_Y: 15.0,

  // Speed (tiles per second)
  PACMAN_SPEED: 7.5,
  GHOST_NORMAL_SPEED: 6.8,
  GHOST_FRIGHTENED_SPEED: 4.0,
  GHOST_EYES_SPEED: 14.0,

  // Timers (seconds)
  FRIGHTENED_DURATION: 7.0,
  FRIGHTENED_FLASH_TIME: 2.0,
  SCATTER_DURATION: 7.0,
  CHASE_DURATION: 20.0,

  // Point Values
  DOT_POINTS: 10,
  POWER_PELLET_POINTS: 50,
  GHOST_BASE_POINTS: 200,
  FRUIT_POINTS: 1000,
  EXTRA_LIFE_THRESHOLD: 10000,
});
