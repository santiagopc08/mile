/**
 * Pac-Man Gameplay Balancing.
 *
 * Valores de ajuste puro: velocidades, temporizadores y puntuación.
 * Se mantiene separado de PacmanConfig (identidad del plugin + geometría del
 * grid) y de PacmanConstants (enums y tipos) para que tocar el balanceo de una
 * partida no obligue a tocar la configuración estructural del plugin.
 */
export const PacmanBalance = Object.freeze({
  // Velocidad (tiles por segundo)
  PACMAN_SPEED: 7.5,
  GHOST_NORMAL_SPEED: 6.8,
  GHOST_FRIGHTENED_SPEED: 4.0,
  GHOST_EYES_SPEED: 14.0,

  // Temporizadores (segundos)
  FRIGHTENED_DURATION: 7.0,
  FRIGHTENED_FLASH_TIME: 2.0,
  SCATTER_DURATION: 7.0,
  CHASE_DURATION: 20.0,

  // Puntuación
  DOT_POINTS: 10,
  POWER_PELLET_POINTS: 50,
  GHOST_BASE_POINTS: 200,
  FRUIT_POINTS: 1000,
  EXTRA_LIFE_THRESHOLD: 10000,
});
