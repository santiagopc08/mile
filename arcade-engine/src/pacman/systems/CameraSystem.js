import { System } from '../../engine/ecs/System.js';

export class CameraSystem extends System {
  constructor(mode = 'TOP_DOWN') {
    super();
    this.mode = mode;
  }

  init(world) {
    super.init(world);
    if (!this.world || !this.world.engine) return;

    const cameraMgr = this.world.engine.cameraManager;

    if (this.mode === 'TOP_DOWN') {
      cameraMgr.camera.position.set(0, 0, 26);
      cameraMgr.camera.lookAt(0, 0, 0);
    } else {
      cameraMgr.camera.position.set(0, -14, 20);
      cameraMgr.camera.lookAt(0, 0, 0);
    }
  }
}
