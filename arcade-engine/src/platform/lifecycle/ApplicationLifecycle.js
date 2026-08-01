export const ApplicationState = Object.freeze({
  INSTALLED: 'INSTALLED',
  LOADED: 'LOADED',
  INITIALIZED: 'INITIALIZED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  UNLOADED: 'UNLOADED',
  REMOVED: 'REMOVED',
});

export class ApplicationLifecycle {
  constructor() {
    this.state = ApplicationState.INSTALLED;
  }

  transitionTo(newState) {
    this.state = newState;
  }
}

export class StartupSequence {
  static run(app) { app.lifecycle.transitionTo(ApplicationState.RUNNING); }
}

export class ShutdownSequence {
  static run(app) { app.lifecycle.transitionTo(ApplicationState.STOPPED); }
}

export class SuspendSequence {
  static run(app) { app.lifecycle.transitionTo(ApplicationState.PAUSED); }
}

export class ResumeSequence {
  static run(app) { app.lifecycle.transitionTo(ApplicationState.RUNNING); }
}
