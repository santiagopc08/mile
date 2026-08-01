/**
 * Pac-Man Constants.
 */
export const TileType = Object.freeze({
  EMPTY: '0',
  WALL: '1',
  PELLET_SPAWN: '2',
  POWER_PELLET_SPAWN: '3',
  SPAWN_PACMAN: 'P',
  SPAWN_GHOST: 'G',
  PORTAL: 'T',
  FRUIT_SPAWN: 'F',
  RESERVED: 'R',
});

export const PluginState = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  LOADING: 'LOADING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
});

export const CameraMode = Object.freeze({
  TOP_DOWN: 'TOP_DOWN',
  PERSPECTIVE: 'PERSPECTIVE',
});

export const Direction = Object.freeze({
  NONE: { x: 0, y: 0, name: 'NONE', angle: 0 },
  UP: { x: 0, y: 1, name: 'UP', angle: Math.PI / 2 },
  DOWN: { x: 0, y: -1, name: 'DOWN', angle: -Math.PI / 2 },
  LEFT: { x: -1, y: 0, name: 'LEFT', angle: Math.PI },
  RIGHT: { x: 1, y: 0, name: 'RIGHT', angle: 0 },
});

export const GhostType = Object.freeze({
  BLINKY: 'BLINKY',
  PINKY: 'PINKY',
  INKY: 'INKY',
  CLYDE: 'CLYDE',
});

export const GhostState = Object.freeze({
  HOUSE: 'HOUSE',
  LEAVING_HOUSE: 'LEAVING_HOUSE',
  SCATTER: 'SCATTER',
  CHASE: 'CHASE',
  FRIGHTENED: 'FRIGHTENED',
  EYES: 'EYES',
});

export const PelletType = Object.freeze({
  DOT: 'DOT',
  POWER: 'POWER',
});
