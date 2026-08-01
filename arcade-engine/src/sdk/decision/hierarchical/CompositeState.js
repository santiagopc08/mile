import { State } from '../fsm/State.js';
import { StateMachine } from '../fsm/StateMachine.js';

export class CompositeState extends State {
  constructor(name) {
    super(name);
    this.subFSM = new StateMachine();
  }

  onUpdate(dt, context) {
    super.onUpdate(dt, context);
    this.subFSM.update(dt, context);
  }
}

export class ParallelState extends State {
  constructor(name, machines = []) {
    super(name);
    this.machines = machines;
  }

  onUpdate(dt, context) {
    super.onUpdate(dt, context);
    this.machines.forEach((m) => m.update(dt, context));
  }
}

export class HierarchicalStateMachine extends StateMachine {}
