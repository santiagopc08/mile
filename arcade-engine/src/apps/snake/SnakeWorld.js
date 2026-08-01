import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { SnakeActorFactory, SnakeController, SnakeDirection } from './SnakeActor.js';
import { FoodActorFactory } from './FoodActor.js';
import { SnakeEvents } from './SnakeEvents.js';

export const GameState = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

/**
 * SnakeWorld — grid-based world for the Snake reference game.
 * Manages the grid, snake, food, score, and game state.
 * Uses only public SDK APIs.
 */
export class SnakeWorld {
  constructor(gridWidth = 20, gridHeight = 15) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    /** @type {SnakeController | null} */
    this.snakeController = null;
    this.foodActor = null;
    this.score = 0;
    this.gameState = GameState.READY;

    // Movement tick accumulator (snake moves at fixed step intervals)
    this.moveInterval = 0.15; // seconds per grid step
    this.moveAccumulator = 0;
  }

  /**
   * Initialize the world: spawn snake and first food.
   */
  initialize() {
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.moveAccumulator = 0;

    // Spawn snake
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    const { segments, direction } = SnakeActorFactory.createSnake(centerX, centerY, 3);

    this.snakeController = new SnakeController(segments, direction);

    for (const segment of segments) {
      this.actorRegistry.register(segment);
    }

    // Spawn first food
    this._spawnFood();
  }

  /**
   * Buffer a direction change from player input.
   */
  setDirection(dir) {
    if (this.snakeController && this.gameState === GameState.PLAYING) {
      this.snakeController.setDirection(dir);
    }
  }

  /**
   * Main update: accumulates time and advances the snake at fixed intervals.
   */
  update(dt) {
    if (this.gameState !== GameState.PLAYING) return;

    this.moveAccumulator += dt;

    while (this.moveAccumulator >= this.moveInterval) {
      this.moveAccumulator -= this.moveInterval;
      this._step();
      if (this.gameState !== GameState.PLAYING) break;
    }

    // Update actor components
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  /**
   * Execute one discrete grid step.
   */
  _step() {
    const result = this.snakeController.advance();

    // 1. Check wall collision
    if (
      result.headX < 0 ||
      result.headX >= this.gridWidth ||
      result.headY < 0 ||
      result.headY >= this.gridHeight
    ) {
      this._gameOver();
      return;
    }

    // 2. Check self-collision
    if (this.snakeController.checkSelfCollision()) {
      this._gameOver();
      return;
    }

    // 3. Check food collision
    if (
      this.foodActor &&
      result.headX === this.foodActor.gridX &&
      result.headY === this.foodActor.gridY
    ) {
      this._consumeFood();
    }

    // 4. Register any new body segment created during growth
    const lastSegment = this.snakeController.segments[this.snakeController.segments.length - 1];
    if (!this.actorRegistry.get(lastSegment.id)) {
      this.actorRegistry.register(lastSegment);
    }

    this.eventBus.emit(SnakeEvents.SNAKE_MOVED, {
      headX: result.headX,
      headY: result.headY,
      length: this.snakeController.segments.length,
    });
  }

  _consumeFood() {
    this.score++;
    this.snakeController.grow(1);

    this.eventBus.emit(SnakeEvents.FOOD_CONSUMED, { score: this.score });

    // Remove old food and spawn new
    if (this.foodActor) {
      this.actorRegistry.unregister(this.foodActor.id);
    }
    this._spawnFood();

    this.eventBus.emit(SnakeEvents.SNAKE_GREW, {
      length: this.snakeController.segments.length + 1,
    });
  }

  _spawnFood() {
    // Build a set of occupied cells
    const occupied = new Set();
    if (this.snakeController) {
      for (const seg of this.snakeController.segments) {
        occupied.add(`${seg.gridX},${seg.gridY}`);
      }
    }

    // Pick a random free cell
    const freeCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) return; // Grid full — win condition

    const cell = freeCells[Math.floor(Math.random() * freeCells.length)];
    this.foodActor = FoodActorFactory.createFood('food_active', cell.x, cell.y);
    this.actorRegistry.register(this.foodActor);

    this.eventBus.emit(SnakeEvents.FOOD_SPAWNED, { x: cell.x, y: cell.y });
  }

  _gameOver() {
    this.gameState = GameState.GAME_OVER;
    this.eventBus.emit(SnakeEvents.GAME_OVER, { score: this.score });
  }

  /**
   * Reset the world for a new game.
   */
  restart() {
    this.actorRegistry.clear();
    this.foodActor = null;
    this.snakeController = null;
    this.initialize();
    this.eventBus.emit(SnakeEvents.RESTARTED, {});
  }
}
