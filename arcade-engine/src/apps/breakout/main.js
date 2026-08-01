import { BreakoutApp } from './BreakoutApp.js';
import { BreakoutEvents, BreakoutState } from './BreakoutEvents.js';

/**
 * RG-004 — Breakout Reference Application runner.
 *
 * Simulates a full game session:
 *  - Feeds paddle input (alternating left/right)
 *  - Runs continuous ticks until VICTORY, GAME_OVER, or max ticks
 *  - Collects all game events for verification
 */
export function runBreakoutApp() {
  const app = new BreakoutApp();
  app.initialize();

  // --- Event collection ---
  const events = [];

  const allEvents = [
    BreakoutEvents.BRICK_HIT,
    BreakoutEvents.BRICK_DESTROYED,
    BreakoutEvents.POWERUP_SPAWNED,
    BreakoutEvents.POWERUP_COLLECTED,
    BreakoutEvents.LIFE_LOST,
    BreakoutEvents.LEVEL_COMPLETED,
    BreakoutEvents.GAME_COMPLETED,
    BreakoutEvents.BALL_SPAWNED,
    BreakoutEvents.GAME_PAUSED,
    BreakoutEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  // --- Simulation ---
  const DT = 0.016;
  const MAX_TICKS = 30000; // ~8 min safety cap
  let ticks = 0;

  // Simple input pattern: alternate paddle direction to track the ball
  let lastBallX = 40; // centre

  while (ticks < MAX_TICKS) {
    const st = app.world.state;
    if (st === BreakoutState.VICTORY || st === BreakoutState.GAME_OVER) break;

    // Track ball with paddle
    const ballTc = app.world.ball.getComponent('TransformComponent');
    if (ballTc) {
      const paddleTc = app.world.paddle.getComponent('TransformComponent');
      if (paddleTc) {
        const diff = ballTc.x - paddleTc.x;
        app.setPlayerInput(Math.abs(diff) < 1 ? 0 : (diff > 0 ? 1 : -1));
      }
    }

    // Test pause/resume near tick 200
    if (ticks === 200) app.togglePause();
    if (ticks === 202) app.togglePause();

    app.tick(DT);
    ticks++;
  }

  app.stop();

  // --- Results ---
  const status = app.world.hud.getComponent('GameStatusComponent');

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    score: status.score,
    lives: status.lives,
    level: status.level,
    bricksDestroyed: events.filter((e) => e.event === BreakoutEvents.BRICK_DESTROYED).length,
    levelsCompleted: events.filter((e) => e.event === BreakoutEvents.LEVEL_COMPLETED).length,
    powerupsSpawned: events.filter((e) => e.event === BreakoutEvents.POWERUP_SPAWNED).length,
    powerupsCollected: events.filter((e) => e.event === BreakoutEvents.POWERUP_COLLECTED).length,
    livesLost: events.filter((e) => e.event === BreakoutEvents.LIFE_LOST).length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
