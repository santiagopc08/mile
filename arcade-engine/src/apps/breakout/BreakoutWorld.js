import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import {
  PaddleFactory,
  BallFactory,
  BrickFactory,
  PowerupFactory,
  HudFactory,
  FIELD,
} from './BreakoutActors.js';
import { PowerupType } from './BreakoutComponents.js';
import {
  PaddleInputSystem,
  BallMovementSystem,
  PowerupMovementSystem,
  WallCollisionSystem,
  PaddleCollisionSystem,
  BrickCollisionSystem,
  PowerupCollectionSystem,
} from './BreakoutSystems.js';
import { LEVELS } from './BreakoutLevels.js';
import { BreakoutEvents, BreakoutState } from './BreakoutEvents.js';

/**
 * BreakoutWorld — manages the entire game: actors, systems, state, levels.
 * Demonstrates dynamic scene mutation (brick destruction, power-up spawning).
 */
export class BreakoutWorld {
  constructor() {
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    // Actors
    this.paddle = null;
    this.ball = null;
    this.hud = null;
    /** @type {import('../../sdk/actors/core/Actor.js').Actor[]} */
    this.bricks = [];
    /** @type {import('../../sdk/actors/core/Actor.js').Actor[]} */
    this.powerups = [];

    // Systems
    this.paddleInputSystem = new PaddleInputSystem();
    this.ballMovementSystem = new BallMovementSystem();
    this.powerupMovementSystem = new PowerupMovementSystem();
    this.wallCollisionSystem = new WallCollisionSystem();
    this.paddleCollisionSystem = new PaddleCollisionSystem();
    this.brickCollisionSystem = new BrickCollisionSystem();
    this.powerupCollectionSystem = new PowerupCollectionSystem();

    // State
    this.state = BreakoutState.READY;
    this.currentLevelIndex = 0;
    this.transitionCooldown = 0;

    // Audio log (headless collection)
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this.paddle = PaddleFactory.create();
    this.ball = BallFactory.create();
    this.hud = HudFactory.create();

    this.actorRegistry.register(this.paddle);
    this.actorRegistry.register(this.ball);
    this.actorRegistry.register(this.hud);

    this._loadLevel(0);
  }

  // ──────────── Input ────────────

  /** @param {number} dir  -1 left, 0 idle, +1 right */
  setPlayerInput(dir) {
    if (this.state !== BreakoutState.PLAYING) return;
    const input = this.paddle.getComponent('PaddleInputComponent');
    if (input) input.moveDir = dir;
  }

  togglePause() {
    if (this.state === BreakoutState.PLAYING) {
      this.state = BreakoutState.PAUSED;
      this.eventBus.emit(BreakoutEvents.GAME_PAUSED, {});
    } else if (this.state === BreakoutState.PAUSED) {
      this.state = BreakoutState.PLAYING;
      this.eventBus.emit(BreakoutEvents.GAME_RESUMED, {});
    }
  }

  // ──────────── Update ────────────

  update(dt) {
    if (this.state === BreakoutState.PAUSED ||
        this.state === BreakoutState.GAME_OVER ||
        this.state === BreakoutState.VICTORY) {
      return;
    }

    // Level transition cooldown
    if (this.state === BreakoutState.LEVEL_TRANSITION) {
      this.transitionCooldown -= dt;
      if (this.transitionCooldown <= 0) {
        this._loadLevel(this.currentLevelIndex);
      }
      return;
    }

    // --- Run Systems in order ---

    // 1. Input → Paddle
    this.paddleInputSystem.update(dt, this.paddle);

    // 2. Ball movement
    this.ballMovementSystem.update(dt, this.ball);

    // 3. Power-up movement
    this.powerupMovementSystem.update(dt, this.powerups);

    // 4. Wall collision
    const wallResult = this.wallCollisionSystem.update(this.ball);
    if (wallResult.ballLost) {
      this._handleBallLost();
      return;
    }

    // 5. Paddle collision
    this.paddleCollisionSystem.update(this.ball, this.paddle);

    // 6. Brick collision
    const brickResult = this.brickCollisionSystem.update(this.ball, this.bricks);
    this._processBrickHits(brickResult.hitBricks);

    // 7. Power-up collection
    const puResult = this.powerupCollectionSystem.update(this.paddle, this.powerups);
    this._processPowerups(puResult);

    // 8. Consume audio cues
    this._consumeAudio();

    // 9. Check level completion
    if (this.bricks.length === 0) {
      this._handleLevelCompleted();
    }

    // 10. Actor component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Internal: Level Loading ────────────

  _loadLevel(levelIndex) {
    this.currentLevelIndex = levelIndex;
    this.state = BreakoutState.PLAYING;

    const status = this.hud.getComponent('GameStatusComponent');
    status.level = levelIndex + 1;

    // Clear existing bricks and power-ups
    this._clearDynamicActors();

    BrickFactory.resetCounter();
    PowerupFactory.resetCounter();

    // Build bricks from level layout
    const levelDef = LEVELS[levelIndex];
    for (let row = 0; row < levelDef.layout.length; row++) {
      for (let col = 0; col < levelDef.layout[row].length; col++) {
        const tier = levelDef.layout[row][col];
        if (tier > 0) {
          const brick = BrickFactory.create(row, col, tier);
          this.bricks.push(brick);
          this.actorRegistry.register(brick);
        }
      }
    }

    status.bricksRemaining = this.bricks.length;

    // Reset ball position and launch
    const btc = this.ball.getComponent('TransformComponent');
    btc.setPosition(FIELD.WIDTH / 2, FIELD.PADDLE_Y - 2);
    BallFactory.launch(this.ball, levelDef.ballSpeed);

    // Reset paddle position
    const ptc = this.paddle.getComponent('TransformComponent');
    ptc.setPosition(FIELD.WIDTH / 2, FIELD.PADDLE_Y);

    this.eventBus.emit(BreakoutEvents.BALL_SPAWNED, { level: levelIndex + 1 });
  }

  _clearDynamicActors() {
    // Remove all bricks
    for (const brick of this.bricks) {
      this.actorRegistry.unregister(brick.id);
    }
    this.bricks = [];

    // Remove all power-ups
    for (const pu of this.powerups) {
      this.actorRegistry.unregister(pu.id);
    }
    this.powerups = [];
  }

  // ──────────── Internal: Brick Hits ────────────

  _processBrickHits(hitBricks) {
    const status = this.hud.getComponent('GameStatusComponent');

    for (const { brick, destroyed } of hitBricks) {
      const data = brick.getComponent('BrickDataComponent');

      this.eventBus.emit(BreakoutEvents.BRICK_HIT, {
        brickId: brick.id,
        tier: data ? data.tier : 0,
        destroyed,
      });

      if (destroyed) {
        status.score += data ? data.points : 10;
        status.bricksRemaining--;

        // Remove brick from world (scene mutation)
        this.actorRegistry.unregister(brick.id);
        const idx = this.bricks.indexOf(brick);
        if (idx !== -1) this.bricks.splice(idx, 1);

        this.eventBus.emit(BreakoutEvents.BRICK_DESTROYED, {
          brickId: brick.id,
          score: status.score,
          remaining: status.bricksRemaining,
        });

        // Chance to spawn a power-up (20%)
        if (Math.random() < 0.2) {
          this._spawnPowerup(brick);
        }
      }
    }
  }

  // ──────────── Internal: Power-ups ────────────

  _spawnPowerup(fromBrick) {
    const tc = fromBrick.getComponent('TransformComponent');
    if (!tc) return;

    const types = [PowerupType.EXTRA_LIFE, PowerupType.WIDE_PADDLE, PowerupType.SPEED_UP];
    const type = types[Math.floor(Math.random() * types.length)];

    const pu = PowerupFactory.create(tc.x, tc.y, type);
    this.powerups.push(pu);
    this.actorRegistry.register(pu);

    this.eventBus.emit(BreakoutEvents.POWERUP_SPAWNED, { type, x: tc.x, y: tc.y });
  }

  _processPowerups({ collected, expired }) {
    const status = this.hud.getComponent('GameStatusComponent');

    for (const { powerup, type } of collected) {
      this.eventBus.emit(BreakoutEvents.POWERUP_COLLECTED, { type });

      // Apply effect
      switch (type) {
        case PowerupType.EXTRA_LIFE:
          status.lives++;
          break;
        case PowerupType.WIDE_PADDLE: {
          const pcol = this.paddle.getComponent('ColliderComponent');
          if (pcol) pcol.halfWidth = FIELD.PADDLE_WIDTH / 2 * 1.5;
          break;
        }
        case PowerupType.SPEED_UP: {
          const vel = this.ball.getComponent('VelocityComponent');
          if (vel) {
            vel.vx *= 1.15;
            vel.vy *= 1.15;
          }
          break;
        }
      }

      this.actorRegistry.unregister(powerup.id);
      const idx = this.powerups.indexOf(powerup);
      if (idx !== -1) this.powerups.splice(idx, 1);
    }

    for (const pu of expired) {
      this.actorRegistry.unregister(pu.id);
      const idx = this.powerups.indexOf(pu);
      if (idx !== -1) this.powerups.splice(idx, 1);
    }
  }

  // ──────────── Internal: Game Events ────────────

  _handleBallLost() {
    const status = this.hud.getComponent('GameStatusComponent');
    status.lives--;

    this.eventBus.emit(BreakoutEvents.LIFE_LOST, {
      livesRemaining: status.lives,
    });

    if (status.lives <= 0) {
      this.state = BreakoutState.GAME_OVER;
      return;
    }

    // Re-launch ball from centre
    const btc = this.ball.getComponent('TransformComponent');
    btc.setPosition(FIELD.WIDTH / 2, FIELD.PADDLE_Y - 2);
    const levelDef = LEVELS[this.currentLevelIndex];
    BallFactory.launch(this.ball, levelDef.ballSpeed);
  }

  _handleLevelCompleted() {
    this.eventBus.emit(BreakoutEvents.LEVEL_COMPLETED, {
      level: this.currentLevelIndex + 1,
    });

    const nextLevel = this.currentLevelIndex + 1;
    if (nextLevel >= LEVELS.length) {
      this.state = BreakoutState.VICTORY;
      this.eventBus.emit(BreakoutEvents.GAME_COMPLETED, {
        score: this.hud.getComponent('GameStatusComponent').score,
      });
      return;
    }

    // Transition to next level
    this.state = BreakoutState.LEVEL_TRANSITION;
    this.transitionCooldown = 0.5;
    this.currentLevelIndex = nextLevel;
  }

  _consumeAudio() {
    const audio = this.ball.getComponent('AudioCueComponent');
    if (!audio) return;
    const cue = audio.consume();
    if (cue) this.audioLog.push(cue);
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.bricks = [];
    this.powerups = [];
    this.audioLog = [];
    this.currentLevelIndex = 0;
    this.initialize();
  }
}
