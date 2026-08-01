export const BreakoutEvents = Object.freeze({
  BRICK_HIT: 'Breakout.BrickHit',
  BRICK_DESTROYED: 'Breakout.BrickDestroyed',
  POWERUP_SPAWNED: 'Breakout.PowerupSpawned',
  POWERUP_COLLECTED: 'Breakout.PowerupCollected',
  LIFE_LOST: 'Breakout.LifeLost',
  LEVEL_COMPLETED: 'Breakout.LevelCompleted',
  GAME_COMPLETED: 'Breakout.GameCompleted',
  BALL_SPAWNED: 'Breakout.BallSpawned',
  GAME_PAUSED: 'Breakout.GamePaused',
  GAME_RESUMED: 'Breakout.GameResumed',
});

export const BreakoutState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_TRANSITION: 'LEVEL_TRANSITION',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
});
