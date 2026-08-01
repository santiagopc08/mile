import { Actor } from '../../sdk/actors/core/Actor.js';
import { ActorTag } from '../../sdk/actors/identity/ActorTag.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';
import { VelocityComponent } from '../../sdk/movement/components/VelocityComponent.js';
import { SpriteComponent, PresentationComponent } from '../../sdk/presentation/components/PresentationComponent.js';
import {
  ColliderComponent,
  LifetimeComponent,
  RotationComponent,
  ParticleComponent,
  ShipInputComponent,
  GameStatusComponent,
  AudioCueComponent,
} from './AsteroidsComponents.js';
import { AsteroidSize } from './AsteroidsEvents.js';

export const FIELD = Object.freeze({
  WIDTH: 100,
  HEIGHT: 100,
  SHIP_RADIUS: 1.5,
  SHIP_ACCEL: 45,
  SHIP_ROTATION_SPEED: 4.5,
  SHIP_DRAG: 0.98,
  BULLET_SPEED: 70,
  BULLET_LIFETIME: 1.2,
  BULLET_RADIUS: 0.4,
});

export class ShipFactory {
  static createShip() {
    const ship = new Actor('ship_player', 'PlayerShip');
    ship.addTag(ActorTag.PLAYER);
    ship.addTag('SHIP');

    ship.addComponent(new TransformComponent(FIELD.WIDTH / 2, FIELD.HEIGHT / 2));
    ship.addComponent(new VelocityComponent(0, 0));
    ship.addComponent(new RotationComponent(-Math.PI / 2, 0)); // Points UP
    ship.addComponent(new ColliderComponent(FIELD.SHIP_RADIUS));
    ship.addComponent(new ShipInputComponent());
    ship.addComponent(new AudioCueComponent());

    const pres = ship.addComponent(new PresentationComponent());
    pres.sortingOrder = 30;
    ship.addComponent(new SpriteComponent('urn:arcade:textures:ship'));

    return ship;
  }
}

let asteroidIdCounter = 0;

export class AsteroidFactory {
  static createAsteroid(x, y, size = AsteroidSize.LARGE, vx = 0, vy = 0) {
    const id = `asteroid_${asteroidIdCounter++}`;
    const asteroid = new Actor(id, `Asteroid_${size}`);
    asteroid.addTag(ActorTag.ENEMY);
    asteroid.addTag('ASTEROID');

    const radiusMap = { LARGE: 4.0, MEDIUM: 2.0, SMALL: 1.0 };
    const pointsMap = { LARGE: 20, MEDIUM: 50, SMALL: 100 };
    const radius = radiusMap[size] || 2.0;

    asteroid.addComponent(new TransformComponent(x, y));
    asteroid.addComponent(new VelocityComponent(vx, vy));
    asteroid.addComponent(new RotationComponent(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 2));
    asteroid.addComponent(new ColliderComponent(radius));

    const pres = asteroid.addComponent(new PresentationComponent());
    pres.sortingOrder = 20;
    asteroid.addComponent(new SpriteComponent(`urn:arcade:textures:asteroid_${size.toLowerCase()}`));

    asteroid.size = size;
    asteroid.points = pointsMap[size] || 20;
    asteroid.radius = radius;

    return asteroid;
  }

  static resetCounter() {
    asteroidIdCounter = 0;
  }
}

export class BulletFactory {
  static createBullet(index = 0) {
    const bullet = new Actor(`bullet_${index}`, 'Bullet');
    bullet.addTag(ActorTag.PROJECTILE);
    bullet.addTag('BULLET');

    bullet.addComponent(new TransformComponent(0, 0));
    bullet.addComponent(new VelocityComponent(0, 0));
    bullet.addComponent(new ColliderComponent(FIELD.BULLET_RADIUS));
    bullet.addComponent(new LifetimeComponent(FIELD.BULLET_LIFETIME));

    const pres = bullet.addComponent(new PresentationComponent());
    pres.sortingOrder = 25;
    bullet.addComponent(new SpriteComponent('urn:arcade:textures:bullet'));

    return bullet;
  }
}

export class ParticleFactory {
  static createParticle(index = 0) {
    const particle = new Actor(`particle_${index}`, 'Particle');
    particle.addTag('PARTICLE');

    particle.addComponent(new TransformComponent(0, 0));
    particle.addComponent(new VelocityComponent(0, 0));
    particle.addComponent(new LifetimeComponent(0.5));
    particle.addComponent(new ParticleComponent('#ffaa00', 0.5));

    const pres = particle.addComponent(new PresentationComponent());
    pres.sortingOrder = 15;
    particle.addComponent(new SpriteComponent('urn:arcade:textures:spark'));

    return particle;
  }
}

export class HudFactory {
  static create() {
    const hud = new Actor('asteroids_hud', 'AsteroidsHUD');
    hud.addTag('HUD');
    hud.addComponent(new GameStatusComponent(3));
    return hud;
  }
}
