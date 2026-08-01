import { FIELD } from './AsteroidsActors.js';

// ──────────────────────────────────────────
// System: Ship Input (Turning, Acceleration, Shooting)
// ──────────────────────────────────────────
export class ShipInputSystem {
  constructor() {
    this.shootCooldown = 0;
  }

  update(dt, ship, bulletPool) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    const input = ship.getComponent('ShipInputComponent');
    const tc = ship.getComponent('TransformComponent');
    const vel = ship.getComponent('VelocityComponent');
    const rot = ship.getComponent('RotationComponent');
    const audio = ship.getComponent('AudioCueComponent');
    if (!input || !tc || !vel || !rot) return null;

    // 1. Angular Rotation
    rot.angle += input.rotateDir * FIELD.SHIP_ROTATION_SPEED * dt;

    // 2. Thrust Acceleration
    if (input.thrust) {
      const thrustX = Math.cos(rot.angle) * FIELD.SHIP_ACCEL * dt;
      const thrustY = Math.sin(rot.angle) * FIELD.SHIP_ACCEL * dt;
      vel.vx += thrustX;
      vel.vy += thrustY;

      if (audio && Math.random() < 0.2) audio.play('thrust');
    }

    // 3. Drag / Damping
    vel.vx *= Math.pow(FIELD.SHIP_DRAG, dt * 60);
    vel.vy *= Math.pow(FIELD.SHIP_DRAG, dt * 60);

    // 4. Shooting
    if (input.shoot && this.shootCooldown <= 0 && bulletPool) {
      this.shootCooldown = 0.2; // 200ms fire rate
      const bullet = bulletPool.acquire();

      const btc = bullet.getComponent('TransformComponent');
      const bvel = bullet.getComponent('VelocityComponent');
      const blife = bullet.getComponent('LifetimeComponent');

      // Spawn bullet at ship nose
      const noseX = tc.x + Math.cos(rot.angle) * (FIELD.SHIP_RADIUS + 0.5);
      const noseY = tc.y + Math.sin(rot.angle) * (FIELD.SHIP_RADIUS + 0.5);
      btc.setPosition(noseX, noseY);

      bvel.vx = Math.cos(rot.angle) * FIELD.BULLET_SPEED + vel.vx * 0.2;
      bvel.vy = Math.sin(rot.angle) * FIELD.BULLET_SPEED + vel.vy * 0.2;

      if (blife) blife.reset(FIELD.BULLET_LIFETIME);
      if (audio) audio.play('shoot');

      return bullet;
    }

    return null;
  }
}

// ──────────────────────────────────────────
// System: Continuous Physics Integration
// ──────────────────────────────────────────
export class ContinuousPhysicsSystem {
  update(dt, actor) {
    const tc = actor.getComponent('TransformComponent');
    const vel = actor.getComponent('VelocityComponent');
    const rot = actor.getComponent('RotationComponent');

    if (tc && vel) {
      tc.x += vel.vx * dt;
      tc.y += vel.vy * dt;
    }

    if (rot) {
      rot.angle += rot.angularSpeed * dt;
    }
  }
}

// ──────────────────────────────────────────
// System: World Wrapping (Toroidal Space)
// ──────────────────────────────────────────
export class WorldWrappingSystem {
  update(actor) {
    const tc = actor.getComponent('TransformComponent');
    if (!tc) return;

    const margin = 2.0;
    if (tc.x < -margin) tc.x += FIELD.WIDTH + margin * 2;
    else if (tc.x > FIELD.WIDTH + margin) tc.x -= FIELD.WIDTH + margin * 2;

    if (tc.y < -margin) tc.y += FIELD.HEIGHT + margin * 2;
    else if (tc.y > FIELD.HEIGHT + margin) tc.y -= FIELD.HEIGHT + margin * 2;
  }
}

// ──────────────────────────────────────────
// System: Lifetime Expiration
// ──────────────────────────────────────────
export class LifetimeSystem {
  /**
   * @param {number} dt
   * @param {Iterable<any>} actors
   * @returns {any[]} List of expired actors
   */
  update(dt, actors) {
    const expired = [];
    for (const actor of actors) {
      const life = actor.getComponent('LifetimeComponent');
      if (life && life.update(dt)) {
        expired.push(actor);
      }
    }
    return expired;
  }
}

// ──────────────────────────────────────────
// System: Collision Detection (Circle vs Circle)
// ──────────────────────────────────────────
export class CollisionSystem {
  /**
   * Check collisions between bullets and asteroids, and ship and asteroids.
   * @returns {{ bulletHits: Array<{bullet: any, asteroid: any}>, shipHit: any|null }}
   */
  update(ship, bullets, asteroids) {
    const bulletHits = [];
    let shipHit = null;

    // 1. Bullet vs Asteroid
    for (const bullet of bullets) {
      const btc = bullet.getComponent('TransformComponent');
      const bcol = bullet.getComponent('ColliderComponent');
      if (!btc || !bcol) continue;

      for (const asteroid of asteroids) {
        const atc = asteroid.getComponent('TransformComponent');
        const acol = asteroid.getComponent('ColliderComponent');
        if (!atc || !acol) continue;

        const dist = Math.hypot(btc.x - atc.x, btc.y - atc.y);
        if (dist <= bcol.radius + acol.radius) {
          bulletHits.push({ bullet, asteroid });
          break; // Bullet destroyed
        }
      }
    }

    // 2. Ship vs Asteroid
    if (ship && ship.enabled) {
      const stc = ship.getComponent('TransformComponent');
      const scol = ship.getComponent('ColliderComponent');
      if (stc && scol) {
        for (const asteroid of asteroids) {
          const atc = asteroid.getComponent('TransformComponent');
          const acol = asteroid.getComponent('ColliderComponent');
          if (!atc || !acol) continue;

          const dist = Math.hypot(stc.x - atc.x, stc.y - atc.y);
          if (dist <= scol.radius + acol.radius) {
            shipHit = asteroid;
            break;
          }
        }
      }
    }

    return { bulletHits, shipHit };
  }
}

// ──────────────────────────────────────────
// System: Particle Explosion System
// ──────────────────────────────────────────
export class ParticleSystem {
  /**
   * Spawn explosion particle burst.
   */
  spawnExplosion(x, y, count = 12, particlePool) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = particlePool.acquire();
      const ptc = p.getComponent('TransformComponent');
      const pvel = p.getComponent('VelocityComponent');
      const plife = p.getComponent('LifetimeComponent');

      ptc.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 30;

      pvel.vx = Math.cos(angle) * speed;
      pvel.vy = Math.sin(angle) * speed;
      if (plife) plife.reset(0.3 + Math.random() * 0.4);

      particles.push(p);
    }
    return particles;
  }
}
