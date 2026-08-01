import { ActorLookup } from './ActorLookup.js';
import { ActorCollection } from './ActorLookup.js';
import { ActorState } from '../state/ActorState.js';

export class ActorRegistry {
  constructor() {
    this.collection = new ActorCollection();
    this.lookupIndex = new ActorLookup();
  }

  register(actor) {
    this.collection.add(actor);
    this.lookupIndex.indexActor(actor);
    actor.state = ActorState.ACTIVE;
    return actor;
  }

  unregister(actorId) {
    const actor = this.collection.get(actorId);
    if (actor) {
      this.lookupIndex.unindexActor(actor);
      actor.state = ActorState.DESTROYED;
      this.collection.remove(actorId);
    }
  }

  get(actorId) {
    return this.collection.get(actorId);
  }

  getByTag(tag) {
    return this.lookupIndex.getByTag(tag);
  }

  getByGroup(group) {
    return this.lookupIndex.getByGroup(group);
  }

  update(dt) {
    this.collection.actors.forEach((actor) => {
      if (actor.state === ActorState.ACTIVE) actor.update(dt);
    });
  }

  clear() {
    this.collection.actors.clear();
    this.lookupIndex.tagIndex.clear();
    this.lookupIndex.groupIndex.clear();
  }
}
