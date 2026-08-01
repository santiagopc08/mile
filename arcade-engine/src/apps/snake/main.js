import { SnakeApp } from './SnakeApp.js';
import { SnakeDirection } from './SnakeActor.js';
import { GameState } from './SnakeWorld.js';
import { SnakeEvents } from './SnakeEvents.js';

/**
 * RG-002 — Snake Reference Application runner.
 *
 * Simulates a complete game session:
 *  - Initializes the app
 *  - Feeds directional input
 *  - Runs multiple ticks
 *  - Validates game state transitions
 */
export function runSnakeApp() {
  const app = new SnakeApp();
  app.initialize();

  // Subscribe to events for verification
  const events = [];
  app.world.eventBus.subscribe(SnakeEvents.FOOD_CONSUMED, (payload) => {
    events.push({ type: 'FOOD_CONSUMED', score: payload.score });
  });
  app.world.eventBus.subscribe(SnakeEvents.SNAKE_MOVED, (payload) => {
    events.push({ type: 'SNAKE_MOVED', headX: payload.headX, headY: payload.headY });
  });
  app.world.eventBus.subscribe(SnakeEvents.GAME_OVER, (payload) => {
    events.push({ type: 'GAME_OVER', score: payload.score });
  });

  // Simulate 30 ticks of gameplay
  const TICK_DT = 0.16; // Faster than moveInterval to accumulate steps

  // Phase 1: Move RIGHT (default) for 5 ticks
  for (let i = 0; i < 5; i++) {
    app.tick(TICK_DT);
  }

  // Phase 2: Change to DOWN and tick
  app.handleInput(SnakeDirection.DOWN);
  for (let i = 0; i < 5; i++) {
    app.tick(TICK_DT);
  }

  // Phase 3: Change to LEFT
  app.handleInput(SnakeDirection.LEFT);
  for (let i = 0; i < 5; i++) {
    app.tick(TICK_DT);
  }

  // Phase 4: Change to UP
  app.handleInput(SnakeDirection.UP);
  for (let i = 0; i < 5; i++) {
    app.tick(TICK_DT);
  }

  // Phase 5: Continue moving for more ticks
  for (let i = 0; i < 10; i++) {
    app.tick(TICK_DT);
  }

  app.stop();

  return {
    app,
    events,
    finalState: app.world.gameState,
    finalScore: app.world.score,
    snakeLength: app.world.snakeController
      ? app.world.snakeController.segments.length
      : 0,
    totalEventsEmitted: events.length,
  };
}
