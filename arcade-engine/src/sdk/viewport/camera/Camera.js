import { OrthographicProjection } from '../projection/Projection.js';

export class CameraTarget {
  constructor(targetActor = null) {
    this.targetActor = targetActor;
  }

  getPosition() {
    if (!this.targetActor) return { x: 0, y: 0 };
    const transform = this.targetActor.getComponent('TransformComponent');
    return transform ? { x: transform.x, y: transform.y } : { x: 0, y: 0 };
  }
}

export class Camera {
  constructor(x = 0, y = 0, zoom = 1.0) {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.zoom = zoom;
    this.target = null;
    this.controller = null;
    this.projection = new OrthographicProjection(zoom);
    this.constraints = [];
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class CameraRig {
  constructor(cameras = []) {
    this.cameras = cameras;
  }
}
