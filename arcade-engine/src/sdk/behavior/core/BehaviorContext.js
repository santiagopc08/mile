export class BehaviorContext {
  constructor(actor = null, decision = null, world = null, services = null) {
    this.actor = actor;
    this.decision = decision;
    this.world = world;
    this.services = services;
  }
}
