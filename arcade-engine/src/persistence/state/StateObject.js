export const StateScope = Object.freeze({
  GLOBAL: 'GLOBAL',
  APP: 'APP',
  PLUGIN: 'PLUGIN',
  RUNTIME: 'RUNTIME',
});

export class StateVersion {
  constructor(version = '1.0.0') {
    this.version = version;
  }
}

export class StateObject {
  constructor(key, value, scope = StateScope.APP) {
    this.key = key;
    this.value = value;
    this.scope = scope;
    this.timestamp = Date.now();
  }
}

export class StateContainer {
  constructor() {
    this.states = new Map();
  }

  set(key, stateObject) { this.states.set(key, stateObject); }
  get(key) { return this.states.get(key) || null; }
  delete(key) { this.states.delete(key); }
  clear() { this.states.clear(); }
}
