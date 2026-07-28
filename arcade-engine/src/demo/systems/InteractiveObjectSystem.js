import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { TestObjectComponent, TestObjectType } from '../components/TestObjectComponent.js';

export class InteractiveObjectSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, TestObjectComponent]);
  }

  update(dt) {
    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const testObj = this.world.getComponent(entity, TestObjectComponent);
      const sprite = this.world.getComponent(entity, SpriteComponent);

      testObj.pulseTimer += dt;

      // 1. Rotating Coins & Crystals
      if (testObj.type === TestObjectType.COIN || testObj.type === TestObjectType.CRYSTAL) {
        transform.rotation.y += 2.0 * dt;
        transform.rotation.z += 1.0 * dt;
        transform.position.y = testObj.initialY + Math.sin(testObj.pulseTimer * 3.0) * 0.25;
      }

      // 2. Pulsing Buttons & Lights
      if (testObj.type === TestObjectType.BUTTON || testObj.type === TestObjectType.LIGHT) {
        const scale = 1.0 + Math.sin(testObj.pulseTimer * 4.0) * 0.1;
        transform.scale.set(scale, scale, scale);
      }

      // 3. Floating Platforms
      if (testObj.type === TestObjectType.PLATFORM) {
        transform.position.x = Math.sin(testObj.pulseTimer * 1.5) * 3.0;
      }
    }
  }
}
