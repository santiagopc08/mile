import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * Circular bounding volume for collision detection.
 */
export class ColliderComponent extends ActorComponent {
  constructor(radius = 1.0) {
    super('ColliderComponent');
    this.radius = radius;
  }
}

/**
 * Lifetime timer for auto-despawning bullets and particles.
 */
export class LifetimeComponent extends ActorComponent {
  constructor(duration = 2.0) {
    super('LifetimeComponent');
    this.duration = duration;
    this.elapsed = 0;
  }

  reset(duration = 2.0) {
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    return this.elapsed >= this.duration;
  }
}

/**
 * Angular rotation component for ship turning and spinning asteroids.
 */
export class RotationComponent extends ActorComponent {
  constructor(angle = 0, angularSpeed = 0) {
    super('RotationComponent');
    this.angle = angle;
    this.angularSpeed = angularSpeed;
  }
}

/**
 * Particle visual data (color, size, alpha fade).
 */
export class ParticleComponent extends ActorComponent {
  constructor(color = '#ffffff', startSize = 0.5) {
    super('ParticleComponent');
    this.color = color;
    this.size = startSize;
    this.alpha = 1.0;
  }
}

/**
 * Player ship input state (rotate left/right, thrust, shoot).
 */
export class ShipInputComponent extends ActorComponent {
  constructor() {
    super('ShipInputComponent');
    this.rotateDir = 0; // -1 left, 0 idle, +1 right
    this.thrust = false;
    this.shoot = false;
  }
}

/**
 * Game status / HUD component for score, lives, wave.
 */
export class GameStatusComponent extends ActorComponent {
  constructor(lives = 3) {
    super('GameStatusComponent');
    this.score = 0;
    this.lives = lives;
    this.wave = 1;
    this.asteroidsRemaining = 0;
  }
}

/**
 * Audio cue marker for sound triggers.
 */
export class AudioCueComponent extends ActorComponent {
  constructor() {
    super('AudioCueComponent');
    /** @type {string|null} */
    this.pending = null;
  }

  play(cueName) {
    this.pending = cueName;
  }

  consume() {
    const cue = this.pending;
    this.pending = null;
    return cue;
  }
}
