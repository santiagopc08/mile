import { ActorComponent } from '../../sdk/actors/components/ActorComponent.js';
import { TetrominoType } from './TetrisEvents.js';
import { TETROMINO_SHAPES, TETROMINO_COLORS } from './TetrisTetrominoes.js';

/**
 * Grid position for discrete 10x20 placement.
 */
export class GridPositionComponent extends ActorComponent {
  constructor(gridX = 3, gridY = 0) {
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
 * Tetromino data component storing piece type, current matrix shape, and color.
 */
export class TetrominoComponent extends ActorComponent {
  constructor(type = TetrominoType.T) {
    super('TetrominoComponent');
    this.type = type;
    this.matrix = TETROMINO_SHAPES[type].map((row) => [...row]);
    this.color = TETROMINO_COLORS[type];
  }

  setShape(matrix) {
    this.matrix = matrix.map((row) => [...row]);
  }
}

/**
 * Player input component storing move, drop, rotate, and hold intents.
 */
export class TetrisInputComponent extends ActorComponent {
  constructor() {
    super('TetrisInputComponent');
    this.moveX = 0;       // -1 left, 0 idle, +1 right
    this.rotateDir = 0;   // +1 CW, -1 CCW
    this.softDrop = false;
    this.hardDrop = false;
    this.hold = false;
  }

  reset() {
    this.moveX = 0;
    this.rotateDir = 0;
    this.softDrop = false;
    this.hardDrop = false;
    this.hold = false;
  }
}

/**
 * Game status / HUD component for score, lines cleared, level, and high score.
 */
export class GameStatusComponent extends ActorComponent {
  constructor() {
    super('GameStatusComponent');
    this.score = 0;
    this.highScore = 0;
    this.lines = 0;
    this.level = 1;
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
