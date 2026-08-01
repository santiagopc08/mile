export const ActorState = Object.freeze({
  CREATED: 'CREATED',
  INITIALIZED: 'INITIALIZED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISABLED: 'DISABLED',
  DESTROYED: 'DESTROYED',
  DISPOSED: 'DISPOSED',
});

export class ActorFlags {
  constructor(flags = 0) {
    this.flags = flags;
  }
}

export class ActorStatus {
  constructor(state = ActorState.CREATED) {
    this.state = state;
  }
}

export class ActorLifecycle {
  constructor() {
    this.state = ActorState.CREATED;
  }

  transitionTo(newState) {
    this.state = newState;
  }
}
