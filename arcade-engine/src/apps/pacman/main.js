import { PacmanApp } from './PacmanApp.js';
import { PacmanEvents, GameState, GhostState, GhostType } from './PacmanEvents.js';

/**
 * RG-005 — Pac-Man Reference Application runner.
 *
 * Simulates gameplay:
 *  - Initializes app
 *  - Controls Pac-Man movement through maze
 *  - Consumes pellets & power pellets
 *  - Verifies Ghost AI transitions (Scatter, Chase, Frightened)
 *  - Tracks events, high score persistence, and audio cues
 */
export function runPacmanApp() {
  const app = new PacmanApp();
  app.initialize();

  const events = [];
  const allEvents = [
    PacmanEvents.PELLET_CONSUMED,
    PacmanEvents.POWER_PELLET_CONSUMED,
    PacmanEvents.GHOST_STATE_CHANGED,
    PacmanEvents.GHOST_CAPTURED,
    PacmanEvents.LIFE_LOST,
    PacmanEvents.FRUIT_SPAWNED,
    PacmanEvents.FRUIT_CONSUMED,
    PacmanEvents.LEVEL_COMPLETED,
    PacmanEvents.GAME_COMPLETED,
    PacmanEvents.GAME_PAUSED,
    PacmanEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.1; // Discrete step interval for simulation
  const MAX_TICKS = 200;
  let ticks = 0;

  // Input sequence simulating maze traversal
  const inputSequence = [
    { tick: 2, dir: 'LEFT' },
    { tick: 10, dir: 'UP' },
    { tick: 20, dir: 'RIGHT' },
    { tick: 35, dir: 'DOWN' },
    { tick: 50, dir: 'LEFT' },
    { tick: 70, dir: 'UP' },
    { tick: 90, dir: 'RIGHT' },
    { tick: 120, dir: 'DOWN' },
  ];

  while (ticks < MAX_TICKS && app.world.state !== GameState.GAME_OVER && app.world.state !== GameState.VICTORY) {
    const matchedInput = inputSequence.find((i) => i.tick === ticks);
    if (matchedInput) {
      app.setDirection(matchedInput.dir);
    }

    if (ticks === 30) app.togglePause();
    if (ticks === 32) app.togglePause();

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
    highScore: status.highScore,
    lives: status.lives,
    pelletsRemaining: status.pelletsRemaining,
    pelletsConsumed: events.filter((e) => e.event === PacmanEvents.PELLET_CONSUMED).length,
    powerPelletsConsumed: events.filter((e) => e.event === PacmanEvents.POWER_PELLET_CONSUMED).length,
    ghostCaptures: events.filter((e) => e.event === PacmanEvents.GHOST_CAPTURED).length,
    ghostStateChanges: events.filter((e) => e.event === PacmanEvents.GHOST_STATE_CHANGED).length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
