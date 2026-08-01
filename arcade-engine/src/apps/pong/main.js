import { PongApp } from './PongApp.js';
import { PongEvents, PongState } from './PongEvents.js';

/**
 * RG-003 — Pong Reference Application runner.
 *
 * Simulates a full match:
 *  - Feeds player input (paddle up/down)
 *  - Runs continuous ticks until the match ends or max ticks reached
 *  - Collects all game events for verification
 */
export function runPongApp() {
  const app = new PongApp();
  app.initialize();

  // --- Event collection ---
  const events = [];

  const allEvents = [
    PongEvents.ROUND_STARTED,
    PongEvents.BALL_SPAWNED,
    PongEvents.GOAL_SCORED,
    PongEvents.ROUND_ENDED,
    PongEvents.MATCH_ENDED,
    PongEvents.GAME_PAUSED,
    PongEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ type: name, ...payload });
    });
  }

  // --- Simulation ---
  const DT = 0.016;        // ~60 fps
  const MAX_TICKS = 5000;  // Safety cap (~80 s of game time)
  let ticks = 0;

  // Simple input pattern: alternate paddle direction every ~1 second
  let inputTimer = 0;
  let currentDir = 1; // start moving down

  while (ticks < MAX_TICKS && app.world.state !== PongState.FINISHED) {
    // Simulate player input
    inputTimer += DT;
    if (inputTimer >= 1.0) {
      inputTimer = 0;
      currentDir *= -1;
    }
    app.setPlayerInput(currentDir);

    // Test pause/resume on tick 100
    if (ticks === 100) {
      app.togglePause();
    }
    if (ticks === 102) {
      app.togglePause();
    }

    app.tick(DT);
    ticks++;
  }

  app.stop();

  // --- Collect results ---
  const score = app.world.scoreHud.getComponent('ScoreComponent');

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    playerScore: score.playerScore,
    aiScore: score.aiScore,
    winner: score.playerScore >= 5 ? 'player' : score.aiScore >= 5 ? 'ai' : 'none',
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.type))],
  };
}
