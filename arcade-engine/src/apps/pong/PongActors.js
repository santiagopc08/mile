import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { VelocityComponent } from '../../sdk/movement/components/VelocityComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  ColliderComponent,
  SimpleAIComponent,
  PaddleInputComponent,
  ScoreComponent,
  AudioCueComponent,
} from './PongComponents.js';

// ---------- Field constants ----------
export const FIELD = Object.freeze({
  WIDTH: 80,
  HEIGHT: 50,
  PADDLE_WIDTH: 1,
  PADDLE_HEIGHT: 6,
  PADDLE_OFFSET: 3,   // distance from edge
  BALL_SIZE: 1,
  BALL_SPEED: 25,
  PADDLE_SPEED: 20,
  AI_SPEED: 18,
  WIN_SCORE: 5,
});

// ---------- Factories ----------

export class PlayerPaddleFactory {
  static create() {
    const paddle = new Actor('paddle_player', 'PlayerPaddle');
    paddle.addTag(ActorTag.PLAYER);
    paddle.addTag('PADDLE');

    paddle.addComponent(
      new TransformComponent(FIELD.PADDLE_OFFSET, FIELD.HEIGHT / 2)
    );
    paddle.addComponent(
      new ColliderComponent(FIELD.PADDLE_WIDTH / 2, FIELD.PADDLE_HEIGHT / 2)
    );
    paddle.addComponent(new PaddleInputComponent());

    const pres = paddle.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    paddle.addComponent(new SpriteComponent('urn:arcade:textures:paddle_white'));

    return paddle;
  }
}

export class AIPaddleFactory {
  static create() {
    const paddle = new Actor('paddle_ai', 'AIPaddle');
    paddle.addTag(ActorTag.ENEMY);
    paddle.addTag('PADDLE');

    paddle.addComponent(
      new TransformComponent(FIELD.WIDTH - FIELD.PADDLE_OFFSET, FIELD.HEIGHT / 2)
    );
    paddle.addComponent(
      new ColliderComponent(FIELD.PADDLE_WIDTH / 2, FIELD.PADDLE_HEIGHT / 2)
    );
    paddle.addComponent(new SimpleAIComponent(FIELD.AI_SPEED, 0.04));

    const pres = paddle.addComponent(new PresentationComponent());
    pres.sortingOrder = 10;
    paddle.addComponent(new SpriteComponent('urn:arcade:textures:paddle_white'));

    return paddle;
  }
}

export class BallFactory {
  static create() {
    const ball = new Actor('ball', 'Ball');
    ball.addTag(ActorTag.PROJECTILE);
    ball.addTag('BALL');

    ball.addComponent(
      new TransformComponent(FIELD.WIDTH / 2, FIELD.HEIGHT / 2)
    );
    ball.addComponent(new VelocityComponent(0, 0));
    ball.addComponent(
      new ColliderComponent(FIELD.BALL_SIZE / 2, FIELD.BALL_SIZE / 2)
    );
    ball.addComponent(new AudioCueComponent());

    const pres = ball.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    ball.addComponent(new SpriteComponent('urn:arcade:textures:ball_white'));

    return ball;
  }

  /** Launch the ball toward a random direction. */
  static launch(ball) {
    const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // ±30°
    const dirX = Math.random() < 0.5 ? 1 : -1;
    const vel = ball.getComponent('VelocityComponent');
    vel.vx = Math.cos(angle) * FIELD.BALL_SPEED * dirX;
    vel.vy = Math.sin(angle) * FIELD.BALL_SPEED;
  }
}

export class ScoreHudFactory {
  static create() {
    const hud = new Actor('score_hud', 'ScoreHUD');
    hud.addTag('HUD');
    hud.addComponent(new ScoreComponent());
    return hud;
  }
}
