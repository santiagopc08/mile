import { System } from '../engine/ecs/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';

export class MovementSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, VelocityComponent]);
  }

  fixedUpdate(fixedDt) {
    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const velocity = this.world.getComponent(entity, VelocityComponent);

      if (velocity.drag > 0) {
        velocity.velocity.x *= Math.max(0, 1 - velocity.drag * fixedDt);
        velocity.velocity.y *= Math.max(0, 1 - velocity.drag * fixedDt);
      }

      transform.position.x += velocity.velocity.x * fixedDt;
      transform.position.y += velocity.velocity.y * fixedDt;
    }
  }
}
