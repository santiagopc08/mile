import { FIELD } from './PongActors.js';

// ──────────────────────────────────────────
// System: Player Input → Paddle Movement
// ──────────────────────────────────────────
export class PaddleInputSystem {
  update(dt, playerPaddle) {
    const input = playerPaddle.getComponent('PaddleInputComponent');
    if (!input) return;

    const tc = playerPaddle.getComponent('TransformComponent');
    const col = playerPaddle.getComponent('ColliderComponent');
    if (!tc || !col) return;

    tc.y += input.moveDir * FIELD.PADDLE_SPEED * dt;

    // Clamp to field bounds
    const minY = col.halfHeight;
    const maxY = FIELD.HEIGHT - col.halfHeight;
    tc.y = Math.max(minY, Math.min(maxY, tc.y));
  }
}

// ──────────────────────────────────────────
// System: AI Paddle Tracking
// ──────────────────────────────────────────
export class AISystem {
  update(dt, aiPaddle, ball) {
    const ai = aiPaddle.getComponent('SimpleAIComponent');
    const tc = aiPaddle.getComponent('TransformComponent');
    const col = aiPaddle.getComponent('ColliderComponent');
    if (!ai || !tc || !col) return;

    // Update reaction timer and sample ball position
    ai.timer += dt;
    if (ai.timer >= ai.reactionDelay) {
      ai.timer = 0;
      const ballTc = ball.getComponent('TransformComponent');
      if (ballTc) ai.targetY = ballTc.y;
    }

    // Move toward target
    const diff = ai.targetY - tc.y;
    if (Math.abs(diff) > 0.5) {
      tc.y += Math.sign(diff) * Math.min(ai.speed * dt, Math.abs(diff));
    }

    // Clamp
    const minY = col.halfHeight;
    const maxY = FIELD.HEIGHT - col.halfHeight;
    tc.y = Math.max(minY, Math.min(maxY, tc.y));
  }
}

// ──────────────────────────────────────────
// System: Ball Movement
// ──────────────────────────────────────────
export class BallMovementSystem {
  update(dt, ball) {
    const tc = ball.getComponent('TransformComponent');
    const vel = ball.getComponent('VelocityComponent');
    if (!tc || !vel) return;

    tc.x += vel.vx * dt;
    tc.y += vel.vy * dt;
  }
}

// ──────────────────────────────────────────
// System: Collision Detection & Response
// ──────────────────────────────────────────
export class CollisionSystem {
  /**
   * @returns {{ scored: 'player'|'ai'|null }}
   */
  update(dt, ball, playerPaddle, aiPaddle) {
    const btc = ball.getComponent('TransformComponent');
    const bvel = ball.getComponent('VelocityComponent');
    const bcol = ball.getComponent('ColliderComponent');
    const audio = ball.getComponent('AudioCueComponent');
    if (!btc || !bvel || !bcol) return { scored: null };

    // --- Top / Bottom wall bounce ---
    if (btc.y - bcol.halfHeight <= 0) {
      btc.y = bcol.halfHeight;
      bvel.vy = Math.abs(bvel.vy);
      if (audio) audio.play('wall_hit');
    } else if (btc.y + bcol.halfHeight >= FIELD.HEIGHT) {
      btc.y = FIELD.HEIGHT - bcol.halfHeight;
      bvel.vy = -Math.abs(bvel.vy);
      if (audio) audio.play('wall_hit');
    }

    // --- Paddle collision (AABB overlap) ---
    if (this._checkPaddleCollision(btc, bcol, bvel, playerPaddle, audio, 1)) {
      // already handled inside helper
    }
    if (this._checkPaddleCollision(btc, bcol, bvel, aiPaddle, audio, -1)) {
      // already handled inside helper
    }

    // --- Goal detection ---
    if (btc.x - bcol.halfWidth <= 0) {
      if (audio) audio.play('goal');
      return { scored: 'ai' };
    }
    if (btc.x + bcol.halfWidth >= FIELD.WIDTH) {
      if (audio) audio.play('goal');
      return { scored: 'player' };
    }

    return { scored: null };
  }

  /**
   * AABB overlap test between ball and paddle.
   * @param {number} reflectDir  +1 = bounce right (player side), -1 = bounce left (AI side)
   */
  _checkPaddleCollision(btc, bcol, bvel, paddle, audio, reflectDir) {
    const ptc = paddle.getComponent('TransformComponent');
    const pcol = paddle.getComponent('ColliderComponent');
    if (!ptc || !pcol) return false;

    const overlapX =
      btc.x + bcol.halfWidth > ptc.x - pcol.halfWidth &&
      btc.x - bcol.halfWidth < ptc.x + pcol.halfWidth;
    const overlapY =
      btc.y + bcol.halfHeight > ptc.y - pcol.halfHeight &&
      btc.y - bcol.halfHeight < ptc.y + pcol.halfHeight;

    if (overlapX && overlapY) {
      // Reflect X velocity and slightly increase speed
      bvel.vx = Math.abs(bvel.vx) * reflectDir * 1.05;

      // Add spin based on where the ball hit the paddle face
      const relativeY = (btc.y - ptc.y) / pcol.halfHeight; // -1..+1
      bvel.vy += relativeY * 5;

      // Push ball outside paddle to prevent re-trigger
      btc.x = reflectDir > 0
        ? ptc.x + pcol.halfWidth + bcol.halfWidth
        : ptc.x - pcol.halfWidth - bcol.halfWidth;

      if (audio) audio.play('paddle_hit');
      return true;
    }
    return false;
  }
}
