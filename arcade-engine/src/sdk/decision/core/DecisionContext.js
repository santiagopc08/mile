import { Blackboard } from '../context/Blackboard.js';

export class DecisionContext {
  constructor(actor = null, world = null) {
    this.actor = actor;
    this.world = world;
    this.blackboard = new Blackboard();
    this.variables = new Blackboard();
  }
}
