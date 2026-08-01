import { ApplicationLifecycle, ApplicationState } from '../lifecycle/ApplicationLifecycle.js';
import { PermissionSet } from '../permissions/Permission.js';

export class ApplicationDescriptor {
  constructor(manifest) {
    this.manifest = manifest;
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
  }
}

export class ApplicationContext {
  constructor(app = null) {
    this.app = app;
  }
}

export class Application {
  constructor(manifest) {
    this.manifest = manifest;
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.lifecycle = new ApplicationLifecycle();
    this.permissionSet = new PermissionSet();
    this.services = new Map();
  }

  start() {
    this.lifecycle.transitionTo(ApplicationState.RUNNING);
  }

  stop() {
    this.lifecycle.transitionTo(ApplicationState.STOPPED);
  }
}
