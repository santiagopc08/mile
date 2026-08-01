export const RuntimeState = Object.freeze({
  CREATED: 'CREATED',
  INITIALIZED: 'INITIALIZED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  DISPOSED: 'DISPOSED',
});

export class RuntimeLifecycle {
  constructor() {
    this.state = RuntimeState.CREATED;
  }

  transitionTo(newState) {
    this.state = newState;
  }
}

export class StartupSequence {
  static boot(runtime) {
    runtime.lifecycle.transitionTo(RuntimeState.RUNNING);
  }
}

export class ShutdownSequence {
  static shutdown(runtime) {
    runtime.lifecycle.transitionTo(RuntimeState.STOPPED);
  }
}
