import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';

export const SnakeDirection = Object.freeze({
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
});

const DIRECTION_VECTORS = {
  [SnakeDirection.UP]: { dx: 0, dy: -1 },
  [SnakeDirection.DOWN]: { dx: 0, dy: 1 },
  [SnakeDirection.LEFT]: { dx: -1, dy: 0 },
  [SnakeDirection.RIGHT]: { dx: 1, dy: 0 },
};

const OPPOSITE = {
  [SnakeDirection.UP]: SnakeDirection.DOWN,
  [SnakeDirection.DOWN]: SnakeDirection.UP,
  [SnakeDirection.LEFT]: SnakeDirection.RIGHT,
  [SnakeDirection.RIGHT]: SnakeDirection.LEFT,
};

/**
 * Snake actor built from multiple body segment actors.
 * Uses the public SDK API exclusively.
 */
export class SnakeActorFactory {
  /**
   * Create the initial snake (head + initial body segments).
   * @param {number} startX - Grid column for head
   * @param {number} startY - Grid row for head
   * @param {number} initialLength - Number of total segments (including head)
   * @returns {{ headActor: Actor, segments: Actor[], direction: string }}
   */
  static createSnake(startX = 5, startY = 5, initialLength = 3) {
    const segments = [];

    for (let i = 0; i < initialLength; i++) {
      const isHead = i === 0;
      const id = isHead ? 'snake_head' : `snake_body_${i}`;
      const segment = new Actor(id, isHead ? 'SnakeHead' : 'SnakeBody');
      segment.addTag(ActorTag.PLAYER);
      segment.addTag(isHead ? 'SNAKE_HEAD' : 'SNAKE_BODY');

      // Initial body segments trail behind the head horizontally
      segment.addComponent(new TransformComponent(startX - i, startY));

      const presentation = segment.addComponent(new PresentationComponent());
      presentation.sortingOrder = isHead ? 20 : 10;

      const spriteUri = isHead
        ? 'urn:arcade:textures:snake_head'
        : 'urn:arcade:textures:snake_body';
      segment.addComponent(new SpriteComponent(spriteUri));

      // Store grid position directly on the actor for easy access
      segment.gridX = startX - i;
      segment.gridY = startY;

      segments.push(segment);
    }

    return {
      headActor: segments[0],
      segments,
      direction: SnakeDirection.RIGHT,
    };
  }
}

/**
 * Pure-logic snake controller — manages movement, growth, collision.
 * Operates on grid coordinates, never touches rendering.
 */
export class SnakeController {
  constructor(segments, initialDirection = SnakeDirection.RIGHT) {
    /** @type {Actor[]} */
    this.segments = segments;
    this.direction = initialDirection;
    this.nextDirection = initialDirection;
    this.growPending = 0;
  }

  /**
   * Buffer a direction change (prevents 180° reversal).
   */
  setDirection(dir) {
    if (OPPOSITE[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  /**
   * Advance the snake by one cell.
   * Returns the new head position { x, y } and the removed tail position (or null if growing).
   */
  advance() {
    this.direction = this.nextDirection;
    const vec = DIRECTION_VECTORS[this.direction];
    const head = this.segments[0];

    const newX = head.gridX + vec.dx;
    const newY = head.gridY + vec.dy;

    let removedTail = null;

    if (this.growPending > 0) {
      // Grow: duplicate the last segment position, then shift everything
      this.growPending--;
      const tail = this.segments[this.segments.length - 1];
      const newSegment = new Actor(
        `snake_body_${this.segments.length}`,
        'SnakeBody'
      );
      newSegment.addTag(ActorTag.PLAYER);
      newSegment.addTag('SNAKE_BODY');
      newSegment.addComponent(new TransformComponent(tail.gridX, tail.gridY));
      const pres = newSegment.addComponent(new PresentationComponent());
      pres.sortingOrder = 10;
      newSegment.addComponent(new SpriteComponent('urn:arcade:textures:snake_body'));
      newSegment.gridX = tail.gridX;
      newSegment.gridY = tail.gridY;
      this.segments.push(newSegment);
    } else {
      // Shift body: each segment takes the position of the one in front
      const tail = this.segments[this.segments.length - 1];
      removedTail = { x: tail.gridX, y: tail.gridY };
    }

    // Shift body positions from tail to head
    for (let i = this.segments.length - 1; i > 0; i--) {
      const prev = this.segments[i - 1];
      this.segments[i].gridX = prev.gridX;
      this.segments[i].gridY = prev.gridY;
      const tc = this.segments[i].getComponent('TransformComponent');
      if (tc) tc.setPosition(prev.gridX, prev.gridY);
    }

    // Move head
    head.gridX = newX;
    head.gridY = newY;
    const headTc = head.getComponent('TransformComponent');
    if (headTc) headTc.setPosition(newX, newY);

    return { headX: newX, headY: newY, removedTail };
  }

  /**
   * Queue growth by N cells.
   */
  grow(amount = 1) {
    this.growPending += amount;
  }

  /**
   * Check self-collision: does the head overlap any body segment?
   */
  checkSelfCollision() {
    const head = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (
        this.segments[i].gridX === head.gridX &&
        this.segments[i].gridY === head.gridY
      ) {
        return true;
      }
    }
    return false;
  }
}
