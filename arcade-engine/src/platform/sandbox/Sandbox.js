export class SandboxPolicy {
  constructor(allowFilesystem = false, allowStorage = true) {
    this.allowFilesystem = allowFilesystem;
    this.allowStorage = allowStorage;
  }
}

export class SandboxContext {
  constructor(appId) {
    this.appId = appId;
    this.policy = new SandboxPolicy();
  }
}

export class Sandbox {
  constructor(appId) {
    this.context = new SandboxContext(appId);
  }

  executeIsolated(fn) {
    return fn(this.context);
  }
}
