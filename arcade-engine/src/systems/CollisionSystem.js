import { System } from '../engine/ecs/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { ColliderComponent } from '../components/ColliderComponent.js';
import { SpatialGrid } from '../engine/physics/SpatialGrid.js';
import { intersectsAABB, intersectsCircle, intersectsCircleAABB } from '../engine/utils/MathUtils.js';

export class CollisionSystem extends System {
  constructor() {
    super();
    this.spatialGrid = new SpatialGrid(4.0);
  }

  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, ColliderComponent]);
  }

  fixedUpdate(fixedDt) {
    const entities = this.world.getEntitiesForQuery(this.query);
    this.spatialGrid.clear();

    // 1. Broadphase: Insert entities into Spatial Grid
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const collider = this.world.getComponent(entity, ColliderComponent);

      let minX, minY, maxX, maxY;
      if (collider.type === 'circle') {
        minX = transform.position.x - collider.radius;
        maxX = transform.position.x + collider.radius;
        minY = transform.position.y - collider.radius;
        maxY = transform.position.y + collider.radius;
      } else {
        const halfW = collider.width / 2;
        const halfH = collider.height / 2;
        minX = transform.position.x - halfW;
        maxX = transform.position.x + halfW;
        minY = transform.position.y - halfH;
        maxY = transform.position.y + halfH;
      }

      this.spatialGrid.insert(entity.id, minX, minY, maxX, maxY);
    }

    // 2. Narrowphase: Perform candidate hit-testing
    const checkedPairs = new Set();

    for (let i = 0; i < entities.length; i++) {
      const entityA = entities[i];
      const transformA = this.world.getComponent(entityA, TransformComponent);
      const colliderA = this.world.getComponent(entityA, ColliderComponent);

      let minX, minY, maxX, maxY;
      if (colliderA.type === 'circle') {
        minX = transformA.position.x - colliderA.radius;
        maxX = transformA.position.x + colliderA.radius;
        minY = transformA.position.y - colliderA.radius;
        maxY = transformA.position.y + colliderA.radius;
      } else {
        const halfW = colliderA.width / 2;
        const halfH = colliderA.height / 2;
        minX = transformA.position.x - halfW;
        maxX = transformA.position.x + halfW;
        minY = transformA.position.y - halfH;
        maxY = transformA.position.y + halfH;
      }

      const candidateIds = this.spatialGrid.getNearbyEntityIds(minX, minY, maxX, maxY);

      candidateIds.forEach((idB) => {
        if (entityA.id >= idB) return; // Avoid duplicate checks

        const entityB = this.world.getEntity(idB);
        if (!entityB || !entityB.active) return;

        const colliderB = this.world.getComponent(entityB, ColliderComponent);
        if (!colliderB) return;

        // Layer & Mask check
        if ((colliderA.layer & colliderB.mask) === 0 || (colliderB.layer & colliderA.mask) === 0) {
          return;
        }

        const transformB = this.world.getComponent(entityB, TransformComponent);

        // Perform exact shape collision check
        let isHit = false;

        if (colliderA.type === 'aabb' && colliderB.type === 'aabb') {
          const halfWA = colliderA.width / 2;
          const halfHA = colliderA.height / 2;
          const halfWB = colliderB.width / 2;
          const halfHB = colliderB.height / 2;

          isHit = intersectsAABB(
            transformA.position.x - halfWA, transformA.position.y - halfHA,
            transformA.position.x + halfWA, transformA.position.y + halfHA,
            transformB.position.x - halfWB, transformB.position.y - halfHB,
            transformB.position.x + halfWB, transformB.position.y + halfHB
          );
        } else if (colliderA.type === 'circle' && colliderB.type === 'circle') {
          isHit = intersectsCircle(
            transformA.position.x, transformA.position.y, colliderA.radius,
            transformB.position.x, transformB.position.y, colliderB.radius
          );
        } else if (colliderA.type === 'circle' && colliderB.type === 'aabb') {
          const halfWB = colliderB.width / 2;
          const halfHB = colliderB.height / 2;
          isHit = intersectsCircleAABB(
            transformA.position.x, transformA.position.y, colliderA.radius,
            transformB.position.x - halfWB, transformB.position.y - halfHB,
            transformB.position.x + halfWB, transformB.position.y + halfHB
          );
        } else if (colliderA.type === 'aabb' && colliderB.type === 'circle') {
          const halfWA = colliderA.width / 2;
          const halfHA = colliderA.height / 2;
          isHit = intersectsCircleAABB(
            transformB.position.x, transformB.position.y, colliderB.radius,
            transformA.position.x - halfWA, transformA.position.y - halfHA,
            transformA.position.x + halfWA, transformA.position.y + halfHA
          );
        }

        if (isHit) {
          if (colliderA.onCollide) colliderA.onCollide(entityB);
          if (colliderB.onCollide) colliderB.onCollide(entityA);
        }
      });
    }
  }
}
