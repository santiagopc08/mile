import { FIELD } from './BreakoutActors.js';

// ──────────────────────────────────────────
// System: Paddle Input → Horizontal Movement
// ──────────────────────────────────────────
export class PaddleInputSystem {
  update(dt, paddle) {
    const input = paddle.getComponent('PaddleInputComponent');
    const tc = paddle.getComponent('TransformComponent');
    const col = paddle.getComponent('ColliderComponent');
    if (!input || !tc || !col) return;

    tc.x += input.moveDir * FIELD.PADDLE_SPEED * dt;

    // Clamp to field bounds
    const minX = col.halfWidth;
    const maxX = FIELD.WIDTH - col.halfWidth;
    tc.x = Math.max(minX, Math.min(maxX, tc.x));
  }
}

// ──────────────────────────────────────────
// System: Ball Movement (velocity integration)
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
// System: Power-up Movement (falls downward)
// ──────────────────────────────────────────
export class PowerupMovementSystem {
  /**
   * @param {import('../../sdk/actors/core/Actor.js').Actor[]} powerups
   */
  update(dt, powerups) {
    for (const pu of powerups) {
      const tc = pu.getComponent('TransformComponent');
      const vel = pu.getComponent('VelocityComponent');
      if (tc && vel) {
        tc.y += vel.vy * dt;
      }
    }
  }
}

// ──────────────────────────────────────────
// System: Wall Collision (ball bounces off top, left, right walls)
// ──────────────────────────────────────────
export class WallCollisionSystem {
  /**
   * @returns {{ ballLost: boolean }}
   */
  update(ball) {
    const tc = ball.getComponent('TransformComponent');
    const vel = ball.getComponent('VelocityComponent');
    const col = ball.getComponent('ColliderComponent');
    const audio = ball.getComponent('AudioCueComponent');
    if (!tc || !vel || !col) return { ballLost: false };

    // Top wall
    if (tc.y - col.halfHeight <= 0) {
      tc.y = col.halfHeight;
      vel.vy = Math.abs(vel.vy);
      if (audio) audio.play('wall_hit');
    }

    // Left wall
    if (tc.x - col.halfWidth <= 0) {
      tc.x = col.halfWidth;
      vel.vx = Math.abs(vel.vx);
      if (audio) audio.play('wall_hit');
    }

    // Right wall
    if (tc.x + col.halfWidth >= FIELD.WIDTH) {
      tc.x = FIELD.WIDTH - col.halfWidth;
      vel.vx = -Math.abs(vel.vx);
      if (audio) audio.play('wall_hit');
    }

    // Bottom — ball lost
    if (tc.y + col.halfHeight >= FIELD.HEIGHT) {
      return { ballLost: true };
    }

    return { ballLost: false };
  }
}

// ──────────────────────────────────────────
// System: Paddle Collision (ball bounces off paddle)
// ──────────────────────────────────────────
export class PaddleCollisionSystem {
  update(ball, paddle) {
    const btc = ball.getComponent('TransformComponent');
    const bvel = ball.getComponent('VelocityComponent');
    const bcol = ball.getComponent('ColliderComponent');
    const audio = ball.getComponent('AudioCueComponent');
    const ptc = paddle.getComponent('TransformComponent');
    const pcol = paddle.getComponent('ColliderComponent');
    if (!btc || !bvel || !bcol || !ptc || !pcol) return;

    // Only when ball is moving downward
    if (bvel.vy <= 0) return;

    const overlapX =
      btc.x + bcol.halfWidth > ptc.x - pcol.halfWidth &&
      btc.x - bcol.halfWidth < ptc.x + pcol.halfWidth;
    const overlapY =
      btc.y + bcol.halfHeight > ptc.y - pcol.halfHeight &&
      btc.y - bcol.halfHeight < ptc.y + pcol.halfHeight;

    if (overlapX && overlapY) {
      // Reflect upward
      bvel.vy = -Math.abs(bvel.vy);
      btc.y = ptc.y - pcol.halfHeight - bcol.halfHeight;

      // Add spin based on paddle hit position
      const relativeX = (btc.x - ptc.x) / pcol.halfWidth; // -1..+1
      bvel.vx += relativeX * 8;

      if (audio) audio.play('paddle_hit');
    }
  }
}

// ──────────────────────────────────────────
// System: Brick Collision (ball hits bricks)
// ──────────────────────────────────────────
export class BrickCollisionSystem {
  /**
   * @param {import('../../sdk/actors/core/Actor.js').Actor[]} bricks
   * @returns {{ hitBricks: Array<{brick: any, destroyed: boolean}> }}
   */
  update(ball, bricks) {
    const btc = ball.getComponent('TransformComponent');
    const bvel = ball.getComponent('VelocityComponent');
    const bcol = ball.getComponent('ColliderComponent');
    const audio = ball.getComponent('AudioCueComponent');
    if (!btc || !bvel || !bcol) return { hitBricks: [] };

    const hitBricks = [];
    let bounced = false;

    for (const brick of bricks) {
      const brtc = brick.getComponent('TransformComponent');
      const brcol = brick.getComponent('ColliderComponent');
      if (!brtc || !brcol) continue;

      const overlapX =
        btc.x + bcol.halfWidth > brtc.x - brcol.halfWidth &&
        btc.x - bcol.halfWidth < brtc.x + brcol.halfWidth;
      const overlapY =
        btc.y + bcol.halfHeight > brtc.y - brcol.halfHeight &&
        btc.y - bcol.halfHeight < brtc.y + brcol.halfHeight;

      if (overlapX && overlapY) {
        const health = brick.getComponent('HealthComponent');
        const destroyed = health ? health.damage(1) : true;
        hitBricks.push({ brick, destroyed });

        // Bounce ball only once per frame
        if (!bounced) {
          // Determine collision axis
          const dx = btc.x - brtc.x;
          const dy = btc.y - brtc.y;
          const overlapAmtX = bcol.halfWidth + brcol.halfWidth - Math.abs(dx);
          const overlapAmtY = bcol.halfHeight + brcol.halfHeight - Math.abs(dy);

          if (overlapAmtX < overlapAmtY) {
            bvel.vx = Math.abs(bvel.vx) * Math.sign(dx);
            btc.x += Math.sign(dx) * overlapAmtX;
          } else {
            bvel.vy = Math.abs(bvel.vy) * Math.sign(dy);
            btc.y += Math.sign(dy) * overlapAmtY;
          }
          bounced = true;
        }

        if (audio) audio.play(destroyed ? 'brick_destroy' : 'brick_hit');
      }
    }

    return { hitBricks };
  }
}

// ──────────────────────────────────────────
// System: Power-up Collection (paddle catches power-up)
// ──────────────────────────────────────────
export class PowerupCollectionSystem {
  /**
   * @param {import('../../sdk/actors/core/Actor.js').Actor[]} powerups
   * @returns {{ collected: Array<{powerup: any, type: string}>, expired: any[] }}
   */
  update(paddle, powerups) {
    const ptc = paddle.getComponent('TransformComponent');
    const pcol = paddle.getComponent('ColliderComponent');
    if (!ptc || !pcol) return { collected: [], expired: [] };

    const collected = [];
    const expired = [];

    for (const pu of powerups) {
      const tc = pu.getComponent('TransformComponent');
      const col = pu.getComponent('ColliderComponent');
      if (!tc || !col) continue;

      // Fell off screen
      if (tc.y - col.halfHeight > FIELD.HEIGHT) {
        expired.push(pu);
        continue;
      }

      // Overlap with paddle
      const overlapX =
        tc.x + col.halfWidth > ptc.x - pcol.halfWidth &&
        tc.x - col.halfWidth < ptc.x + pcol.halfWidth;
      const overlapY =
        tc.y + col.halfHeight > ptc.y - pcol.halfHeight &&
        tc.y - col.halfHeight < ptc.y + pcol.halfHeight;

      if (overlapX && overlapY) {
        const effect = pu.getComponent('PowerupEffectComponent');
        collected.push({ powerup: pu, type: effect ? effect.type : 'UNKNOWN' });
      }
    }

    return { collected, expired };
  }
}
