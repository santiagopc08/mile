export class CameraController {
  update(camera, dt) {}
}

export class FollowCameraController extends CameraController {
  constructor(lerpSpeed = 5.0) {
    super();
    this.lerpSpeed = lerpSpeed;
  }

  update(camera, dt) {
    if (!camera || !camera.target) return;
    const targetPos = camera.target.getPosition();
    const lerpFactor = Math.min(1.0, this.lerpSpeed * dt);
    camera.x += (targetPos.x - camera.x) * lerpFactor;
    camera.y += (targetPos.y - camera.y) * lerpFactor;
    camera.constraints.forEach((c) => c.apply(camera));
  }
}

export class FreeCameraController extends CameraController {}
export class StaticCameraController extends CameraController {}
export class RailCameraController extends CameraController {}
