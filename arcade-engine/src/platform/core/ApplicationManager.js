import { ApplicationRegistry } from '../registry/ApplicationRegistry.js';
import { ApplicationLoader } from '../loader/ApplicationLoader.js';
import { Application } from './Application.js';
import { ApplicationManifest } from './ApplicationManifest.js';

export class ApplicationBuilder {
  constructor(manifestData) {
    this.manifest = new ApplicationManifest(manifestData);
  }

  build() {
    return new Application(this.manifest);
  }
}

export class ApplicationManager {
  constructor() {
    this.registry = new ApplicationRegistry();
    this.loader = new ApplicationLoader(this.registry);
    this.activeApps = new Map();
  }

  installApp(manifestData) {
    const manifest = this.loader.load(manifestData);
    const app = new Application(manifest);
    this.registry.register(app);
    return app;
  }

  startApp(appId) {
    const app = this.registry.get(appId);
    if (app) {
      app.start();
      this.activeApps.set(appId, app);
    }
  }

  stopApp(appId) {
    const app = this.activeApps.get(appId);
    if (app) {
      app.stop();
      this.activeApps.delete(appId);
    }
  }
}
