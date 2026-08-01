import { LifecycleError } from '../errors/SDKError.js';

export const LifecycleState = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZING: 'INITIALIZING',
  INITIALIZED: 'INITIALIZED',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  DISPOSED: 'DISPOSED',
});

export class Lifecycle {
  constructor() {
    this.state = LifecycleState.UNINITIALIZED;
  }

  transitionTo(newState) {
    if (this.state === LifecycleState.DISPOSED && newState !== LifecycleState.DISPOSED) {
      throw new LifecycleError(`Cannot transition from DISPOSED to ${newState}`);
    }
    this.state = newState;
    return this.state;
  }

  is(state) {
    return this.state === state;
  }
}
