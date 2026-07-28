import * as THREE from 'three';
import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';

export const CameraModes = ['PERSPECTIVE', 'TOP_DOWN', 'ISOMETRIC', 'FOLLOW', 'FREE'];

export class CameraFollowSystem extends System {
  constructor() {
    super();
    this.modeIndex = 0;
    this.mode = CameraModes[0];
  }

  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent]);
  }

  cycleCameraMode() {
    this.modeIndex = (this.modeIndex + 1) % CameraModes.length;
    this.mode = CameraModes[this.modeIndex];

    if (this.world && this.world.engine) {
      this.world.engine.eventBus.emit('CameraChanged', { mode: this.mode });
    }
  }

  lateUpdate(dt) {
    if (!this.world || !this.world.engine) return;
    const cameraMgr = this.world.engine.cameraManager;
    const input = this.world.engine.inputManager;

    // F2 Key to cycle Camera Mode
    if (input.wasActionJustPressed('CYCLE_CAMERA')) {
      this.cycleCameraMode();
    }

    // Find Player Entity
    const entities = this.world.getEntitiesForQuery(this.query);
    let playerTransform = null;

    for (let i = 0; i < entities.length; i++) {
      if (entities[i].name === 'TestPlayer') {
        playerTransform = this.world.getComponent(entities[i], TransformComponent);
        break;
      }
    }

    if (!playerTransform) return;

    // Configure camera according to active mode
    switch (this.mode) {
      case 'PERSPECTIVE':
        cameraMgr.camera.position.set(
          playerTransform.position.x,
          playerTransform.position.y - 12,
          14
        );
        cameraMgr.camera.lookAt(playerTransform.position.x, playerTransform.position.y, 0);
        break;

      case 'TOP_DOWN':
        cameraMgr.camera.position.set(
          playerTransform.position.x,
          playerTransform.position.y,
          18
        );
        cameraMgr.camera.lookAt(playerTransform.position.x, playerTransform.position.y, 0);
        break;

      case 'ISOMETRIC':
        cameraMgr.camera.position.set(
          playerTransform.position.x + 10,
          playerTransform.position.y - 10,
          12
        );
        cameraMgr.camera.lookAt(playerTransform.position.x, playerTransform.position.y, 0);
        break;

      case 'FOLLOW':
        cameraMgr.setTarget(playerTransform.position.x, playerTransform.position.y, 0);
        break;

      case 'FREE':
        // Static laboratory overview camera
        cameraMgr.camera.position.set(0, 0, 25);
        cameraMgr.camera.lookAt(0, 0, 0);
        break;
    }
  }
}
