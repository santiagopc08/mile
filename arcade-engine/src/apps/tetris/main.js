import { TetrisApp } from './TetrisApp.js';
import { TetrisEvents, TetrisState } from './TetrisEvents.js';

/**
 * RG-007 — Tetris Reference Application runner.
 *
 * Simulates gameplay:
 *  - Controls piece movement, rotation (CW/CCW), soft drop, hard drop, and hold
 *  - Tests composite actor creation & structural grid line clears
 *  - Verifies replay event recording
 *  - Validates high score persistence
 */
export function runTetrisApp() {
  const app = new TetrisApp();
  app.initialize();

  const events = [];
  const allEvents = [
    TetrisEvents.PIECE_SPAWNED,
    TetrisEvents.PIECE_LOCKED,
    TetrisEvents.LINE_COMPLETED,
    TetrisEvents.LINES_REMOVED,
    TetrisEvents.LEVEL_UP,
    TetrisEvents.GAME_OVER,
    TetrisEvents.REPLAY_SAVED,
    TetrisEvents.GAME_PAUSED,
    TetrisEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.05; // 20 fps simulation step
  const MAX_TICKS = 800; // ~40 seconds of gameplay
  let ticks = 0;

  // Sequence of gameplay inputs to simulate piece placement, rotation, hard drops, and holds
  const inputSequence = [
    { tick: 5, action: 'rotateCW' },
    { tick: 10, action: 'moveLeft' },
    { tick: 15, action: 'hardDrop' },

    { tick: 25, action: 'rotateCCW' },
    { tick: 30, action: 'moveRight' },
    { tick: 35, action: 'hardDrop' },

    { tick: 45, action: 'holdPiece' },
    { tick: 55, action: 'moveLeft' },
    { tick: 60, action: 'hardDrop' },

    { tick: 75, action: 'rotateCW' },
    { tick: 80, action: 'moveRight' },
    { tick: 85, action: 'hardDrop' },

    { tick: 95, action: 'hardDrop' },
    { tick: 110, action: 'hardDrop' },
    { tick: 125, action: 'hardDrop' },
    { tick: 140, action: 'hardDrop' },
    { tick: 155, action: 'hardDrop' },
    { tick: 170, action: 'hardDrop' },
    { tick: 185, action: 'hardDrop' },
    { tick: 200, action: 'hardDrop' },
  ];

  while (ticks < MAX_TICKS && app.world.state !== TetrisState.GAME_OVER) {
    const match = inputSequence.find((i) => i.tick === ticks);
    if (match && typeof app[match.action] === 'function') {
      app[match.action]();
    }

    if (ticks === 50) app.togglePause();
    if (ticks === 52) app.togglePause();

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
    linesCleared: status.lines,
    level: status.level,
    lockedBlocksCount: app.world.lockedBlockActors.size,
    piecesSpawned: events.filter((e) => e.event === TetrisEvents.PIECE_SPAWNED).length,
    piecesLocked: events.filter((e) => e.event === TetrisEvents.PIECE_LOCKED).length,
    linesCompleted: events.filter((e) => e.event === TetrisEvents.LINE_COMPLETED).length,
    replayEventsRecorded: app.world.replayRecorder.replay.events.length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
