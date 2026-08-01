import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * AABB collider — reused pattern from Pong, shared across all Breakout actors.
 */
export class ColliderComponent extends ActorComponent {
  constructor(halfWidth, halfHeight) {
    super('ColliderComponent');
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;
  }
}

/**
 * Health for bricks. When hp reaches 0 the brick is destroyed.
 */
export class HealthComponent extends ActorComponent {
  constructor(hp = 1) {
    super('HealthComponent');
    this.hp = hp;
    this.maxHp = hp;
  }

  damage(amount = 1) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }
}

/**
 * Paddle input receiver.
 */
export class PaddleInputComponent extends ActorComponent {
  constructor() {
    super('PaddleInputComponent');
    this.moveDir = 0; // -1 left, 0 idle, +1 right
  }
}

/**
 * Lives and level tracking (attached to HUD actor).
 */
export class GameStatusComponent extends ActorComponent {
  constructor(lives = 3) {
    super('GameStatusComponent');
    this.lives = lives;
    this.score = 0;
    this.level = 1;
    this.bricksRemaining = 0;
  }
}

/**
 * Power-up effect descriptor — describes what collecting it does.
 */
export const PowerupType = Object.freeze({
  WIDE_PADDLE: 'WIDE_PADDLE',
  EXTRA_LIFE: 'EXTRA_LIFE',
  SPEED_UP: 'SPEED_UP',
});

export class PowerupEffectComponent extends ActorComponent {
  constructor(type = PowerupType.EXTRA_LIFE, duration = 5.0) {
    super('PowerupEffectComponent');
    this.type = type;
    this.duration = duration;
  }
}

/**
 * Audio cue marker — same pattern as Pong.
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

/**
 * Brick metadata — row, column, point value, colour tier.
 */
export class BrickDataComponent extends ActorComponent {
  constructor(row = 0, col = 0, points = 10, tier = 0) {
    super('BrickDataComponent');
    this.row = row;
    this.col = col;
    this.points = points;
    this.tier = tier;
  }
}
