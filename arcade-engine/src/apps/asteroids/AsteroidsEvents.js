export const AsteroidsEvents = Object.freeze({
  BULLET_SPAWNED: 'Asteroids.BulletSpawned',
  ASTEROID_DESTROYED: 'Asteroids.AsteroidDestroyed',
  ASTEROID_SPLIT: 'Asteroids.AsteroidSplit',
  EXPLOSION_CREATED: 'Asteroids.ExplosionCreated',
  LIFE_LOST: 'Asteroids.LifeLost',
  WAVE_COMPLETED: 'Asteroids.WaveCompleted',
  GAME_OVER: 'Asteroids.GameOver',
  GAME_PAUSED: 'Asteroids.GamePaused',
  GAME_RESUMED: 'Asteroids.GameResumed',
});

export const AsteroidsState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  WAVE_TRANSITION: 'WAVE_TRANSITION',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
});

export const AsteroidSize = Object.freeze({
  LARGE: 'LARGE',   // Radius 4.0, 20 pts, splits into 2 Medium
  MEDIUM: 'MEDIUM', // Radius 2.0, 50 pts, splits into 2 Small
  SMALL: 'SMALL',   // Radius 1.0, 100 pts, destroyed
});
