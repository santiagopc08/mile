/**
 * Classic Pac-Man Constants.
 */
export const Direction = Object.freeze({
  NONE: { x: 0, y: 0, name: 'NONE', angle: 0 },
  UP: { x: 0, y: 1, name: 'UP', angle: Math.PI / 2 },
  DOWN: { x: 0, y: -1, name: 'DOWN', angle: -Math.PI / 2 },
  LEFT: { x: -1, y: 0, name: 'LEFT', angle: Math.PI },
  RIGHT: { x: 1, y: 0, name: 'RIGHT', angle: 0 },
});

export const GhostType = Object.freeze({
  BLINKY: 'BLINKY', // Red - Shadow
  PINKY: 'PINKY',   // Pink - Speedy
  INKY: 'INKY',     // Cyan - Bashful
  CLYDE: 'CLYDE',   // Orange - Pokey
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
