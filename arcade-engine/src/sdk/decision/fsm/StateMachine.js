import { TransitionHistory } from '../history/TransitionHistory.js';

export class StateMachine {
  constructor() {
    this.states = new Map();
    this.transitions = [];
    this.currentState = null;
    this.history = new TransitionHistory();
  }

  addState(state) {
    this.states.set(state.name, state);
    if (!this.currentState) {
      this.currentState = state;
    }
  }

  addTransition(transition) {
    this.transitions.push(transition);
  }

  changeState(targetStateName, context) {
    if (!this.states.has(targetStateName)) return false;
    const nextState = this.states.get(targetStateName);
    const prevState = this.currentState;

    if (prevState) prevState.onExit(nextState ? nextState.name : '', context);
    this.history.record(prevState ? prevState.name : '', nextState.name);
    this.currentState = nextState;
    this.currentState.onEnter(prevState ? prevState.name : '', context);
    return true;
  }

  update(dt, context) {
    if (!this.currentState) return;

    // Check transition conditions
    for (const transition of this.transitions) {
      if (transition.originState === this.currentState.name && transition.canTransition(context)) {
        this.changeState(transition.destinationState, context);
        break;
      }
    }

    if (this.currentState) {
      this.currentState.onUpdate(dt, context);
    }
  }
}
