import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { VelocityComponent } from '../../components/VelocityComponent.js';
import { PlayerControlComponent } from '../components/PlayerControlComponent.js';
import { EngineEvents } from '../../engine/core/EventBus.js';

export class PlayerControlSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, VelocityComponent, PlayerControlComponent]);
  }

  fixedUpdate(fixedDt) {
    if (!this.world || !this.world.engine) return;
    const input = this.world.engine.inputManager;

    const axis = input.getAxisVector('MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_DOWN', 'MOVE_UP');
    const isSprinting = input.isActionActive('SPRINT');

    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const velocity = this.world.getComponent(entity, VelocityComponent);
      const control = this.world.getComponent(entity, PlayerControlComponent);

      const targetSpeed = control.speed * (isSprinting ? control.sprintMultiplier : 1.0);

      // Target Velocity
      const targetVx = axis.x * targetSpeed;
      const targetVy = axis.y * targetSpeed;

      // Smooth Acceleration & Friction
      const accelRate = (axis.x !== 0 || axis.y !== 0) ? control.acceleration : control.friction;

      velocity.velocity.x += (targetVx - velocity.velocity.x) * Math.min(1, accelRate * fixedDt);
      velocity.velocity.y += (targetVy - velocity.velocity.y) * Math.min(1, accelRate * fixedDt);

      // Rotation towards movement direction
      if (axis.x !== 0 || axis.y !== 0) {
        const targetAngle = Math.atan2(axis.y, axis.x) - Math.PI / 2;
        transform.rotation.z += (targetAngle - transform.rotation.z) * 12.0 * fixedDt;

        // Emit PlayerMoved Event
        this.world.engine.eventBus.emit('PlayerMoved', {
          x: transform.position.x.toFixed(2),
          y: transform.position.y.toFixed(2),
          speed: Math.hypot(velocity.velocity.x, velocity.velocity.y).toFixed(2),
        });
      }
    }
  }
}
