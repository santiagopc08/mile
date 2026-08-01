export const PacmanEvents = Object.freeze({
  PELLET_CONSUMED: 'Pacman.PelletConsumed',
  POWER_PELLET_CONSUMED: 'Pacman.PowerPelletConsumed',
  GHOST_STATE_CHANGED: 'Pacman.GhostStateChanged',
  GHOST_CAPTURED: 'Pacman.GhostCaptured',
  LIFE_LOST: 'Pacman.LifeLost',
  FRUIT_SPAWNED: 'Pacman.FruitSpawned',
  FRUIT_CONSUMED: 'Pacman.FruitConsumed',
  LEVEL_COMPLETED: 'Pacman.LevelCompleted',
  GAME_COMPLETED: 'Pacman.GameCompleted',
  GAME_PAUSED: 'Pacman.GamePaused',
  GAME_RESUMED: 'Pacman.GameResumed',
});

export const GameState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
});

export const GhostState = Object.freeze({
  SCATTER: 'SCATTER',
  CHASE: 'CHASE',
  FRIGHTENED: 'FRIGHTENED',
  RESPAWNING: 'RESPAWNING',
});

export const GhostType = Object.freeze({
  BLINKY: 'BLINKY', // Red
  PINKY: 'PINKY',   // Pink
  INKY: 'INKY',     // Cyan
  CLYDE: 'CLYDE',   // Orange
});

export const Direction = Object.freeze({
  UP: { dx: 0, dy: -1, name: 'UP' },
  DOWN: { dx: 0, dy: 1, name: 'DOWN' },
  LEFT: { dx: -1, dy: 0, name: 'LEFT' },
  RIGHT: { dx: 1, dy: 0, name: 'RIGHT' },
  NONE: { dx: 0, dy: 0, name: 'NONE' },
});
