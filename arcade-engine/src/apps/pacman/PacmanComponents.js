import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';
import { GhostState, GhostType, Direction } from './PacmanEvents.js';

/**
 * Grid position component for discrete tile movement.
 */
export class GridPositionComponent extends ActorComponent {
  constructor(gridX = 0, gridY = 0) {
    super('GridPositionComponent');
    this.gridX = gridX;
    this.gridY = gridY;
  }

  set(x, y) {
    this.gridX = x;
    this.gridY = y;
  }
}

/**
 * Navigation component storing current direction and queued next direction.
 */
export class NavigationComponent extends ActorComponent {
  constructor() {
    super('NavigationComponent');
    this.currentDirection = Direction.NONE;
    this.nextDirection = Direction.NONE;
    this.speed = 1.0; // grid cells per step
  }
}

/**
 * Input buffer for player (Pac-Man).
 */
export class PacmanInputComponent extends ActorComponent {
  constructor() {
    super('PacmanInputComponent');
    this.bufferedDirection = Direction.NONE;
  }
}

/**
 * Cognitive & Ghost Behavior component storing ghost identity, current AI state, and corner target.
 */
export class GhostBehaviorComponent extends ActorComponent {
  constructor(ghostType = GhostType.BLINKY, scatterCorner = { x: 0, y: 0 }) {
    super('GhostBehaviorComponent');
    this.ghostType = ghostType;
    this.state = GhostState.SCATTER;
    this.previousState = GhostState.SCATTER;
    this.scatterCorner = scatterCorner;
    this.targetTile = { x: 0, y: 0 };
    this.homeTile = { x: 13, y: 14 }; // Ghost House centre
    this.frightenedTimer = 0;
  }

  setState(newState) {
    if (this.state !== newState) {
      this.previousState = this.state;
      this.state = newState;
    }
  }
}

/**
 * Perception component for ghost target calculation.
 */
export class PerceptionComponent extends ActorComponent {
  constructor() {
    super('PerceptionComponent');
    this.perceivedPacmanPos = { x: 0, y: 0 };
    this.perceivedPacmanDir = Direction.NONE;
    this.perceivedBlinkyPos = { x: 0, y: 0 };
  }
}

/**
 * Game status / HUD component for score, lives, high score, and level.
 */
export class GameStatusComponent extends ActorComponent {
  constructor(lives = 3) {
    super('GameStatusComponent');
    this.score = 0;
    this.highScore = 0;
    this.lives = lives;
    this.level = 1;
    this.pelletsRemaining = 0;
    this.ghostCombo = 0; // points multiplier for capturing consecutive ghosts
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
