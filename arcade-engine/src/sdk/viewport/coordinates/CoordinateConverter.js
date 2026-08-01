export class ScreenSpace {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

export class WorldSpace {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

export class ViewportSpace {
  constructor(u = 0, v = 0) {
    this.u = u;
    this.v = v;
  }
}

export class CoordinateConverter {
  static worldToScreen(worldX, worldY, camera, viewportWidth = 800, viewportHeight = 600) {
    const screenX = (worldX - camera.x) * camera.zoom + viewportWidth / 2;
    const screenY = (worldY - camera.y) * camera.zoom + viewportHeight / 2;
    return new ScreenSpace(screenX, screenY);
  }

  static screenToWorld(screenX, screenY, camera, viewportWidth = 800, viewportHeight = 600) {
    const worldX = (screenX - viewportWidth / 2) / camera.zoom + camera.x;
    const worldY = (screenY - viewportHeight / 2) / camera.zoom + camera.y;
    return new WorldSpace(worldX, worldY);
  }
}
