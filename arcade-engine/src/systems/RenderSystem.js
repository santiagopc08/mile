import { System } from '../engine/ecs/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { SpriteComponent } from '../components/SpriteComponent.js';

export class RenderSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, SpriteComponent]);
  }

  render(alpha) {
    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const sprite = this.world.getComponent(entity, SpriteComponent);

      if (sprite && sprite.mesh) {
        sprite.mesh.position.copy(transform.position);
        sprite.mesh.rotation.copy(transform.rotation);
        sprite.mesh.scale.copy(transform.scale);
        sprite.mesh.visible = sprite.visible;
      }
    }
  }
}
