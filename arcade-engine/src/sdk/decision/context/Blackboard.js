export class Blackboard {
  constructor() {
    this.data = new Map();
  }

  get(key, defaultValue = undefined) {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  set(key, value) {
    this.data.set(key, value);
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

export class DecisionVariables extends Blackboard {}
export class DecisionMemory extends Blackboard {}
