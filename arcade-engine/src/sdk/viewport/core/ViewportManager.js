import { Camera } from '../camera/Camera.js';

export class ViewportContext {
  constructor(viewport = null) {
    this.viewport = viewport;
  }
}

export class Viewport {
  constructor(id = 'main', width = 800, height = 600) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.camera = new Camera();
    this.visible = true;
    this.scale = 1.0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

export class ViewportCollection {
  constructor() {
    this.viewports = new Map();
  }

  add(viewport) { this.viewports.set(viewport.id, viewport); }
  get(id) { return this.viewports.get(id) || null; }
  remove(id) { this.viewports.delete(id); }
}

export class ViewportManager {
  constructor() {
    this.collection = new ViewportCollection();
    this.mainViewport = new Viewport('main');
    this.collection.add(this.mainViewport);
  }

  createViewport(id, width, height) {
    const vp = new Viewport(id, width, height);
    this.collection.add(vp);
    return vp;
  }

  update(dt) {
    this.collection.viewports.forEach((vp) => {
      if (vp.camera && vp.camera.controller) {
        vp.camera.controller.update(vp.camera, dt);
      }
    });
  }
}
