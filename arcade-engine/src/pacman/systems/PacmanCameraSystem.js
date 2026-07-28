import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';

export class PacmanCameraSystem extends System {
  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, PacmanGridComponent]);
  }

  lateUpdate(dt) {
    if (!this.world || !this.world.engine) return;
    const cameraMgr = this.world.engine.cameraManager;
    const pacmans = this.world.getEntitiesForQuery(this.query);

    if (pacmans.length > 0) {
      const transform = this.world.getComponent(pacmans[0], TransformComponent);

      // Tilted Arcade Follow View
      cameraMgr.camera.position.set(
        transform.position.x * 0.3, // Slight camera tracking
        transform.position.y * 0.3 - 2.0,
        24
      );
      cameraMgr.camera.lookAt(0, 0, 0);
    }
  }
}
