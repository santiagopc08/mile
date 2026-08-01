export class Transition {
  constructor(originState, destinationState, condition, priority = 0) {
    this.originState = originState;
    this.destinationState = destinationState;
    this.condition = condition;
    this.priority = priority;
  }

  canTransition(context) {
    return this.condition ? this.condition.evaluate(context) : true;
  }
}

export class State {
  constructor(name) {
    this.name = name;
  }

  onEnter(previousState, context) {}
  onUpdate(dt, context) {}
  onExit(nextState, context) {}
}

export class StateStack {
  constructor() {
    this.stack = [];
  }

  push(state) { this.stack.push(state); }
  pop() { return this.stack.pop() || null; }
  peek() { return this.stack[this.stack.length - 1] || null; }
}

export class StateHistory {
  constructor(capacity = 20) {
    this.capacity = capacity;
    this.history = [];
  }

  record(fromState, toState) {
    if (this.history.length >= this.capacity) this.history.shift();
    this.history.push({ from: fromState, to: toState, timestamp: Date.now() });
  }
}
