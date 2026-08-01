import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';

/**
 * Axis-Aligned Bounding Box collider for Pong entities.
 * Stores half-width/half-height relative to the actor's transform centre.
 */
export class ColliderComponent extends ActorComponent {
  constructor(halfWidth, halfHeight) {
    super('ColliderComponent');
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;
  }
}

/**
 * Simple AI controller component — tracks a target actor's Y position.
 */
export class SimpleAIComponent extends ActorComponent {
  constructor(speed = 4.0, reactionDelay = 0.05) {
    super('SimpleAIComponent');
    this.speed = speed;
    this.reactionDelay = reactionDelay;
    this.targetY = 0;
    this.timer = 0;
  }
}

/**
 * Input receiver component — stores the current player intent.
 */
export class PaddleInputComponent extends ActorComponent {
  constructor() {
    super('PaddleInputComponent');
    this.moveDir = 0; // -1 up, 0 idle, +1 down
  }
}

/**
 * Score tracking component (attached to a virtual HUD actor).
 */
export class ScoreComponent extends ActorComponent {
  constructor() {
    super('ScoreComponent');
    this.playerScore = 0;
    this.aiScore = 0;
  }
}

/**
 * Audio cue marker — systems can set the `pending` field to trigger
 * a sound on the next render pass.
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
