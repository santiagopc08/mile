import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import {
  ShipFactory,
  AsteroidFactory,
  BulletFactory,
  ParticleFactory,
  HudFactory,
  FIELD,
} from './AsteroidsActors.js';
import { EntityPool } from './AsteroidsPool.js';
import {
  ShipInputSystem,
  ContinuousPhysicsSystem,
  WorldWrappingSystem,
  LifetimeSystem,
  CollisionSystem,
  ParticleSystem,
} from './AsteroidsSystems.js';
import { AsteroidsEvents, AsteroidsState, AsteroidSize } from './AsteroidsEvents.js';

export class AsteroidsWorld {
  constructor() {
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    // Entity Pools (high efficiency, zero GC allocations)
    this.bulletPool = new EntityPool((i) => BulletFactory.createBullet(i), 30);
    this.particlePool = new EntityPool((i) => ParticleFactory.createParticle(i), 60);

    // Actors
    this.ship = null;
    this.hud = null;
    /** @type {import('../../sdk/actors/core/Actor.js').Actor[]} */
    this.asteroids = [];

    // Systems
    this.shipInputSystem = new ShipInputSystem();
    this.physicsSystem = new ContinuousPhysicsSystem();
    this.wrappingSystem = new WorldWrappingSystem();
    this.lifetimeSystem = new LifetimeSystem();
    this.collisionSystem = new CollisionSystem();
    this.particleSystem = new ParticleSystem();

    // State
    this.state = AsteroidsState.READY;
    this.wave = 1;
    this.transitionCooldown = 0;

    // Audio log (headless collection)
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this.ship = ShipFactory.createShip();
    this.hud = HudFactory.create();

    this.actorRegistry.register(this.ship);
    this.actorRegistry.register(this.hud);

    this._startWave(1);
  }

  // ──────────── Input ────────────

  /**
   * @param {number} rotateDir -1 left, 0 idle, +1 right
   * @param {boolean} thrust
   * @param {boolean} shoot
   */
  setPlayerInput(rotateDir, thrust, shoot) {
    if (this.state !== AsteroidsState.PLAYING) return;
    const input = this.ship.getComponent('ShipInputComponent');
    if (input) {
      input.rotateDir = rotateDir;
      input.thrust = thrust;
      input.shoot = shoot;
    }
  }

  togglePause() {
    if (this.state === AsteroidsState.PLAYING) {
      this.state = AsteroidsState.PAUSED;
      this.eventBus.emit(AsteroidsEvents.GAME_PAUSED, {});
    } else if (this.state === AsteroidsState.PAUSED) {
      this.state = AsteroidsState.PLAYING;
      this.eventBus.emit(AsteroidsEvents.GAME_RESUMED, {});
    }
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === AsteroidsState.PAUSED ||
        this.state === AsteroidsState.GAME_OVER ||
        this.state === AsteroidsState.VICTORY) {
      return;
    }

    if (this.state === AsteroidsState.WAVE_TRANSITION) {
      this.transitionCooldown -= dt;
      if (this.transitionCooldown <= 0) {
        this._startWave(this.wave + 1);
      }
      return;
    }

    // 1. Ship Input & Bullet Firing
    const spawnedBullet = this.shipInputSystem.update(dt, this.ship, this.bulletPool);
    if (spawnedBullet) {
      this.actorRegistry.register(spawnedBullet);
      this.eventBus.emit(AsteroidsEvents.BULLET_SPAWNED, {});
    }

    // 2. Physics Integration (Ship, Asteroids, Bullets, Particles)
    this.physicsSystem.update(dt, this.ship);
    for (const ast of this.asteroids) this.physicsSystem.update(dt, ast);
    for (const bullet of this.bulletPool.active) this.physicsSystem.update(dt, bullet);
    for (const part of this.particlePool.active) this.physicsSystem.update(dt, part);

    // 3. World Wrapping
    this.wrappingSystem.update(this.ship);
    for (const ast of this.asteroids) this.wrappingSystem.update(ast);
    for (const bullet of this.bulletPool.active) this.wrappingSystem.update(bullet);

    // 4. Lifetime Expiration (Bullets & Particles)
    const expiredBullets = this.lifetimeSystem.update(dt, this.bulletPool.active);
    for (const b of expiredBullets) {
      this.actorRegistry.unregister(b.id);
      this.bulletPool.release(b);
    }

    const expiredParticles = this.lifetimeSystem.update(dt, this.particlePool.active);
    for (const p of expiredParticles) {
      this.actorRegistry.unregister(p.id);
      this.particlePool.release(p);
    }

    // 5. Collision System (Bullet-Asteroid & Ship-Asteroid)
    const colResult = this.collisionSystem.update(
      this.ship,
      Array.from(this.bulletPool.active),
      this.asteroids
    );

    this._processBulletHits(colResult.bulletHits);
    if (colResult.shipHit) {
      this._processShipHit(colResult.shipHit);
    }

    // 6. Audio Cue Consumption
    this._consumeAudio();

    // 7. Check Wave Completion
    if (this.asteroids.length === 0 && this.state === AsteroidsState.PLAYING) {
      this._handleWaveCompleted();
    }

    // 8. Actor Component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Wave Management ────────────

  _startWave(waveNumber) {
    this.wave = waveNumber;
    this.state = AsteroidsState.PLAYING;

    const status = this.hud.getComponent('GameStatusComponent');
    status.wave = waveNumber;

    // Reset ship position & velocity
    const stc = this.ship.getComponent('TransformComponent');
    const svel = this.ship.getComponent('VelocityComponent');
    stc.setPosition(FIELD.WIDTH / 2, FIELD.HEIGHT / 2);
    svel.vx = 0;
    svel.vy = 0;
    this.ship.enabled = true;

    // Spawn wave asteroids (4 + wave * 2)
    AsteroidFactory.resetCounter();
    const count = 3 + waveNumber * 2;
    for (let i = 0; i < count; i++) {
      const pos = this._getRandomSpawnPos();
      const speed = 10 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;

      const ast = AsteroidFactory.createAsteroid(
        pos.x,
        pos.y,
        AsteroidSize.LARGE,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      this.asteroids.push(ast);
      this.actorRegistry.register(ast);
    }

    status.asteroidsRemaining = this.asteroids.length;
  }

  _getRandomSpawnPos() {
    // Spawn near edges to avoid spawning directly on top of ship
    let x = Math.random() * FIELD.WIDTH;
    let y = Math.random() * FIELD.HEIGHT;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 5 : FIELD.WIDTH - 5;
    } else {
      y = Math.random() < 0.5 ? 5 : FIELD.HEIGHT - 5;
    }
    return { x, y };
  }

  // ──────────── Hierarchical Asteroid Splitting ────────────

  _processBulletHits(bulletHits) {
    const status = this.hud.getComponent('GameStatusComponent');

    for (const { bullet, asteroid } of bulletHits) {
      // Recycle bullet
      this.actorRegistry.unregister(bullet.id);
      this.bulletPool.release(bullet);

      // Score points
      status.score += asteroid.points;

      // Spawn explosion particles
      const atc = asteroid.getComponent('TransformComponent');
      const particles = this.particleSystem.spawnExplosion(atc.x, atc.y, 10, this.particlePool);
      for (const p of particles) this.actorRegistry.register(p);

      this.eventBus.emit(AsteroidsEvents.EXPLOSION_CREATED, { x: atc.x, y: atc.y });

      // Unregister destroyed asteroid
      this.actorRegistry.unregister(asteroid.id);
      const idx = this.asteroids.indexOf(asteroid);
      if (idx !== -1) this.asteroids.splice(idx, 1);

      this.eventBus.emit(AsteroidsEvents.ASTEROID_DESTROYED, {
        size: asteroid.size,
        points: asteroid.points,
        score: status.score,
      });

      // Hierarchical fragmentation: LARGE -> 2 MEDIUM -> 2 SMALL -> 0
      let nextSize = null;
      if (asteroid.size === AsteroidSize.LARGE) nextSize = AsteroidSize.MEDIUM;
      else if (asteroid.size === AsteroidSize.MEDIUM) nextSize = AsteroidSize.SMALL;

      if (nextSize) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 15 + Math.random() * 20;
          const fragment = AsteroidFactory.createAsteroid(
            atc.x,
            atc.y,
            nextSize,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
          this.asteroids.push(fragment);
          this.actorRegistry.register(fragment);
        }

        this.eventBus.emit(AsteroidsEvents.ASTEROID_SPLIT, {
          parentSize: asteroid.size,
          childSize: nextSize,
        });
      }

      this._audio('explosion');
    }

    status.asteroidsRemaining = this.asteroids.length;
  }

  // ──────────── Ship Hit & Life Loss ────────────

  _processShipHit(asteroid) {
    const status = this.hud.getComponent('GameStatusComponent');
    status.lives--;

    const stc = this.ship.getComponent('TransformComponent');
    const particles = this.particleSystem.spawnExplosion(stc.x, stc.y, 20, this.particlePool);
    for (const p of particles) this.actorRegistry.register(p);

    this.eventBus.emit(AsteroidsEvents.LIFE_LOST, { livesRemaining: status.lives });
    this._audio('ship_explosion');

    if (status.lives <= 0) {
      this.state = AsteroidsState.GAME_OVER;
      this.ship.enabled = false;
      this.eventBus.emit(AsteroidsEvents.GAME_OVER, { score: status.score });
    } else {
      // Respawn ship at centre
      stc.setPosition(FIELD.WIDTH / 2, FIELD.HEIGHT / 2);
      const svel = this.ship.getComponent('VelocityComponent');
      svel.vx = 0;
      svel.vy = 0;
    }
  }

  _handleWaveCompleted() {
    this.eventBus.emit(AsteroidsEvents.WAVE_COMPLETED, { wave: this.wave });
    this.state = AsteroidsState.WAVE_TRANSITION;
    this.transitionCooldown = 1.0;
  }

  _audio(cue) {
    this.audioLog.push(cue);
  }

  _consumeAudio() {
    const audio = this.ship ? this.ship.getComponent('AudioCueComponent') : null;
    if (audio) {
      const cue = audio.consume();
      if (cue) this._audio(cue);
    }
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.bulletPool.releaseAll();
    this.particlePool.releaseAll();
    this.asteroids = [];
    this.audioLog = [];
    this.wave = 1;
    this.initialize();
  }
}
