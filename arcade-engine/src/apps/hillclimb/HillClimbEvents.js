export const HillClimbEvents = Object.freeze({
  VEHICLE_SPAWNED: 'HillClimb.VehicleSpawned',
  FUEL_COLLECTED: 'HillClimb.FuelCollected',
  COIN_COLLECTED: 'HillClimb.CoinCollected',
  VEHICLE_FLIPPED: 'HillClimb.VehicleFlipped',
  FUEL_EMPTY: 'HillClimb.FuelEmpty',
  DISTANCE_UPDATED: 'HillClimb.DistanceUpdated',
  RUN_COMPLETED: 'HillClimb.RunCompleted',
  GAME_PAUSED: 'HillClimb.GamePaused',
  GAME_RESUMED: 'HillClimb.GameResumed',
});

export const HillClimbState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  RESPAWNING: 'RESPAWNING',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
});
