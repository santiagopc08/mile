export const MovementMode = Object.freeze({
  GRID: 'GRID',
  FREE: 'FREE',
  CONTINUOUS: 'CONTINUOUS',
  PATH: 'PATH',
  WAYPOINT: 'WAYPOINT',
  CUSTOM: 'CUSTOM',
});

export const MovementState = Object.freeze({
  IDLE: 'IDLE',
  MOVING: 'MOVING',
  PAUSED: 'PAUSED',
  BLOCKED: 'BLOCKED',
});

export class MovementProfile {
  constructor(maxSpeed = 5.0, acceleration = 10.0, deceleration = 10.0) {
    this.maxSpeed = maxSpeed;
    this.acceleration = acceleration;
    this.deceleration = deceleration;
  }
}

export class MovementConfig {
  constructor(mode = MovementMode.GRID, profile = new MovementProfile()) {
    this.mode = mode;
    this.profile = profile;
  }
}

export class MovementContext {
  constructor(dt = 0.016, isPaused = false) {
    this.dt = dt;
    this.isPaused = isPaused;
  }
}
