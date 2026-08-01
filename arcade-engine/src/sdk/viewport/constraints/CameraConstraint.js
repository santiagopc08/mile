export class CameraConstraint {
  apply(camera) {}
}

export class BoundsConstraint extends CameraConstraint {
  constructor(minX, minY, maxX, maxY) {
    super();
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  apply(camera) {
    camera.x = Math.max(this.minX, Math.min(this.maxX, camera.x));
    camera.y = Math.max(this.minY, Math.min(this.maxY, camera.y));
  }
}

export class DeadZoneConstraint extends CameraConstraint {
  constructor(width = 2, height = 2) {
    super();
    this.width = width;
    this.height = height;
  }
}

export class ZoomConstraint extends CameraConstraint {
  constructor(minZoom = 0.5, maxZoom = 3.0) {
    super();
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
  }

  apply(camera) {
    camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, camera.zoom));
  }
}
