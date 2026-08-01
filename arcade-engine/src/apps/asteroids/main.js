import { AsteroidsApp } from './AsteroidsApp.js';
import { AsteroidsEvents, AsteroidsState } from './AsteroidsEvents.js';

/**
 * RG-006 — Asteroids Reference Application runner.
 *
 * Simulates gameplay:
 *  - Controls ship rotation, thrust, and continuous shooting
 *  - Tests bullet pooling and particle pooling
 *  - Verifies hierarchical fragmentation (Large -> Medium -> Small)
 *  - Tests world wrapping across screen boundaries
 *  - Validates high entity counts with performance stability
 */
export function runAsteroidsApp() {
  const app = new AsteroidsApp();
  app.initialize();

  const events = [];
  const allEvents = [
    AsteroidsEvents.BULLET_SPAWNED,
    AsteroidsEvents.ASTEROID_DESTROYED,
    AsteroidsEvents.ASTEROID_SPLIT,
    AsteroidsEvents.EXPLOSION_CREATED,
    AsteroidsEvents.LIFE_LOST,
    AsteroidsEvents.WAVE_COMPLETED,
    AsteroidsEvents.GAME_OVER,
    AsteroidsEvents.GAME_PAUSED,
    AsteroidsEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.016; // 60 fps simulation
  const MAX_TICKS = 1500; // ~25 seconds of continuous combat simulation
  let ticks = 0;

  let rotateDir = 1;
  let rotateTimer = 0;

  while (ticks < MAX_TICKS && app.world.state !== AsteroidsState.GAME_OVER) {
    rotateTimer += DT;
    if (rotateTimer > 0.5) {
      rotateTimer = 0;
      rotateDir *= -1; // Change rotation direction every 500ms
    }

    // Continuous thrust and aggressive shooting to test pooling & high entity counts
    app.setPlayerInput(rotateDir, true, true);

    if (ticks === 100) app.togglePause();
    if (ticks === 102) app.togglePause();

    app.tick(DT);
    ticks++;
  }

  app.stop();

  const status = app.world.hud.getComponent('GameStatusComponent');

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    score: status.score,
    lives: status.lives,
    wave: status.wave,
    asteroidsRemaining: app.world.asteroids.length,
    activeBulletsInPool: app.world.bulletPool.getActiveCount(),
    bulletPoolSize: app.world.bulletPool.getPoolSize(),
    activeParticlesInPool: app.world.particlePool.getActiveCount(),
    particlePoolSize: app.world.particlePool.getPoolSize(),
    bulletsSpawned: events.filter((e) => e.event === AsteroidsEvents.BULLET_SPAWNED).length,
    asteroidsDestroyed: events.filter((e) => e.event === AsteroidsEvents.ASTEROID_DESTROYED).length,
    asteroidSplits: events.filter((e) => e.event === AsteroidsEvents.ASTEROID_SPLIT).length,
    explosionsCreated: events.filter((e) => e.event === AsteroidsEvents.EXPLOSION_CREATED).length,
    livesLost: events.filter((e) => e.event === AsteroidsEvents.LIFE_LOST).length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
