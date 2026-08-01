export class Projection {
  project(worldX, worldY) {
    return { x: worldX, y: worldY };
  }

  unproject(screenX, screenY) {
    return { x: screenX, y: screenY };
  }
}

export class OrthographicProjection extends Projection {
  constructor(zoom = 1.0) {
    super();
    this.zoom = zoom;
  }

  project(worldX, worldY) {
    return { x: worldX * this.zoom, y: worldY * this.zoom };
  }

  unproject(screenX, screenY) {
    return { x: screenX / this.zoom, y: screenY / this.zoom };
  }
}

export class PerspectiveProjection extends Projection {}

export class IsometricProjection extends Projection {
  project(worldX, worldY) {
    const isoX = worldX - worldY;
    const isoY = (worldX + worldY) / 2;
    return { x: isoX, y: isoY };
  }
}
