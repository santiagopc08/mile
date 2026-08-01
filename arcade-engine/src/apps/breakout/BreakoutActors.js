import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { VelocityComponent } from '../../sdk/movement/components/VelocityComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  ColliderComponent,
  HealthComponent,
  PaddleInputComponent,
  GameStatusComponent,
  PowerupEffectComponent,
  PowerupType,
  AudioCueComponent,
  BrickDataComponent,
} from './BreakoutComponents.js';

// ──────────── Field Constants ────────────

export const FIELD = Object.freeze({
  WIDTH: 80,
  HEIGHT: 60,
  PADDLE_WIDTH: 8,
  PADDLE_HEIGHT: 1.5,
  PADDLE_Y: 56,          // near bottom
  PADDLE_SPEED: 30,
  BALL_SIZE: 1,
  BALL_SPEED: 22,
  BRICK_WIDTH: 7,
  BRICK_HEIGHT: 2,
  BRICK_AREA_TOP: 4,     // top margin for brick rows
  BRICK_GAP: 0.5,
  POWERUP_SIZE: 2,
  POWERUP_FALL_SPEED: 10,
  INITIAL_LIVES: 3,
});

// ──────────── Paddle ────────────

export class PaddleFactory {
  static create() {
    const paddle = new Actor('paddle', 'PlayerPaddle');
    paddle.addTag(ActorTag.PLAYER);
    paddle.addTag('PADDLE');

    paddle.addComponent(new TransformComponent(FIELD.WIDTH / 2, FIELD.PADDLE_Y));
    paddle.addComponent(new ColliderComponent(FIELD.PADDLE_WIDTH / 2, FIELD.PADDLE_HEIGHT / 2));
    paddle.addComponent(new PaddleInputComponent());

    const pres = paddle.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    paddle.addComponent(new SpriteComponent('urn:arcade:textures:paddle'));

    return paddle;
  }
}

// ──────────── Ball ────────────

export class BallFactory {
  static create() {
    const ball = new Actor('ball', 'Ball');
    ball.addTag(ActorTag.PROJECTILE);
    ball.addTag('BALL');

    ball.addComponent(new TransformComponent(FIELD.WIDTH / 2, FIELD.PADDLE_Y - 2));
    ball.addComponent(new VelocityComponent(0, 0));
    ball.addComponent(new ColliderComponent(FIELD.BALL_SIZE / 2, FIELD.BALL_SIZE / 2));
    ball.addComponent(new AudioCueComponent());

    const pres = ball.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    ball.addComponent(new SpriteComponent('urn:arcade:textures:ball'));

    return ball;
  }

  /** Launch the ball upward with slight random angle. */
  static launch(ball, speed = FIELD.BALL_SPEED) {
    const angle = -Math.PI / 2 + (Math.random() * Math.PI / 6 - Math.PI / 12); // ≈ -75° to -105°
    const vel = ball.getComponent('VelocityComponent');
    vel.vx = Math.cos(angle) * speed;
    vel.vy = Math.sin(angle) * speed;
  }
}

// ──────────── Bricks ────────────

let brickIdCounter = 0;

export class BrickFactory {
  /**
   * Create a single brick.
   * @param {number} row - Grid row
   * @param {number} col - Grid column
   * @param {number} tier - 1-3, determines hp and points
   */
  static create(row, col, tier = 1) {
    const id = `brick_${brickIdCounter++}`;
    const brick = new Actor(id, 'Brick');
    brick.addTag('BRICK');
    brick.addTag(ActorTag.INTERACTIVE);

    const x = (FIELD.WIDTH - 10 * (FIELD.BRICK_WIDTH + FIELD.BRICK_GAP)) / 2
            + col * (FIELD.BRICK_WIDTH + FIELD.BRICK_GAP)
            + FIELD.BRICK_WIDTH / 2;
    const y = FIELD.BRICK_AREA_TOP + row * (FIELD.BRICK_HEIGHT + FIELD.BRICK_GAP) + FIELD.BRICK_HEIGHT / 2;

    brick.addComponent(new TransformComponent(x, y));
    brick.addComponent(new ColliderComponent(FIELD.BRICK_WIDTH / 2, FIELD.BRICK_HEIGHT / 2));
    brick.addComponent(new HealthComponent(tier));
    brick.addComponent(new BrickDataComponent(row, col, tier * 10, tier));

    const pres = brick.addComponent(new PresentationComponent());
    pres.sortingOrder = 5;

    const tierSprites = [
      'urn:arcade:textures:brick_green',
      'urn:arcade:textures:brick_orange',
      'urn:arcade:textures:brick_red',
    ];
    brick.addComponent(new SpriteComponent(tierSprites[Math.min(tier - 1, 2)]));

    return brick;
  }

  /** Reset the ID counter (for level reloads). */
  static resetCounter() {
    brickIdCounter = 0;
  }
}

// ──────────── Power-up ────────────

let powerupIdCounter = 0;

export class PowerupFactory {
  static create(x, y, type = PowerupType.EXTRA_LIFE) {
    const id = `powerup_${powerupIdCounter++}`;
    const pu = new Actor(id, 'Powerup');
    pu.addTag('POWERUP');
    pu.addTag(ActorTag.COLLECTIBLE);

    pu.addComponent(new TransformComponent(x, y));
    pu.addComponent(new VelocityComponent(0, FIELD.POWERUP_FALL_SPEED)); // falls downward
    pu.addComponent(new ColliderComponent(FIELD.POWERUP_SIZE / 2, FIELD.POWERUP_SIZE / 2));
    pu.addComponent(new PowerupEffectComponent(type, 5.0));

    const pres = pu.addComponent(new PresentationComponent());
    pres.sortingOrder = 12;
    pu.addComponent(new SpriteComponent('urn:arcade:textures:powerup'));

    return pu;
  }

  static resetCounter() {
    powerupIdCounter = 0;
  }
}

// ──────────── HUD ────────────

export class HudFactory {
  static create() {
    const hud = new Actor('hud', 'HUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent(FIELD.INITIAL_LIVES));
    return hud;
  }
}
