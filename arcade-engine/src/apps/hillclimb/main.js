import { HillClimbApp } from './HillClimbApp.js';
import { HillClimbEvents, HillClimbState } from './HillClimbEvents.js';

/**
 * RG-008 — Hill Climb Reference Application runner.
 *
 * Simulates gameplay:
 *  - Controls vehicle gas / brake inputs over procedural terrain
 *  - Tests suspension joint spring constraints and wheel physics
 *  - Verifies camera follow smooth tracking
 *  - Collects distance updates, coins, fuel consumption, and replay events
 */
export function runHillClimbApp() {
  const app = new HillClimbApp();
  app.initialize();

  const events = [];
  const allEvents = [
    HillClimbEvents.VEHICLE_SPAWNED,
    HillClimbEvents.FUEL_COLLECTED,
    HillClimbEvents.COIN_COLLECTED,
    HillClimbEvents.VEHICLE_FLIPPED,
    HillClimbEvents.FUEL_EMPTY,
    HillClimbEvents.DISTANCE_UPDATED,
    HillClimbEvents.RUN_COMPLETED,
    HillClimbEvents.GAME_PAUSED,
    HillClimbEvents.GAME_RESUMED,
  ];

  for (const name of allEvents) {
    app.world.eventBus.subscribe(name, (payload) => {
      events.push({ event: name, ...payload });
    });
  }

  const DT = 0.016; // 60 fps fixed physics tick
  const MAX_TICKS = 1200; // ~20 seconds of continuous driving simulation
  let ticks = 0;

  while (ticks < MAX_TICKS && app.world.state !== HillClimbState.GAME_OVER) {
    // Drive forward with full gas
    app.setControls(true, false);

    if (ticks === 50) app.togglePause();
    if (ticks === 52) app.togglePause();

    app.tick(DT);
    ticks++;
  }

  app.stop();

  const status = app.world.hud.getComponent('GameStatusComponent');
  const tank = app.world.vehicle.chassis.getComponent('FuelTankComponent');

  return {
    app,
    events,
    ticks,
    finalState: app.world.state,
    distance: status.distance,
    highDistance: status.highDistance,
    coins: status.coins,
    score: status.score,
    fuelRemaining: tank ? Math.round(tank.fuel) : 0,
    cameraX: Math.round(app.world.camera.x),
    cameraY: Math.round(app.world.camera.y),
    collectiblesCount: app.world.collectibles.length,
    distanceUpdates: events.filter((e) => e.event === HillClimbEvents.DISTANCE_UPDATED).length,
    coinsCollected: events.filter((e) => e.event === HillClimbEvents.COIN_COLLECTED).length,
    fuelCollected: events.filter((e) => e.event === HillClimbEvents.FUEL_COLLECTED).length,
    replayEventsRecorded: app.world.replayRecorder.replay.events.length,
    audioLog: app.world.audioLog,
    eventTypes: [...new Set(events.map((e) => e.event))],
  };
}
