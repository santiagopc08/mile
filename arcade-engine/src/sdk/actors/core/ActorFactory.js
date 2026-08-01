import { Actor } from './Actor.js';

export class ActorBuilder {
  constructor(name = 'Actor') {
    this.actor = new Actor(null, name);
  }

  withTag(tag) {
    this.actor.addTag(tag);
    return this;
  }

  withGroup(group) {
    this.actor.addGroup(group);
    return this;
  }

  withComponent(component) {
    this.actor.addComponent(component);
    return this;
  }

  build() {
    return this.actor;
  }
}

export class ActorFactory {
  constructor() {
    this.pool = [];
  }

  create(name = 'Actor') {
    if (this.pool.length > 0) {
      const actor = this.pool.pop();
      actor.name = name;
      return actor;
    }
    return new Actor(null, name);
  }

  recycle(actor) {
    actor.tags.clear();
    actor.groups.clear();
    actor.metadata.clear();
    this.pool.push(actor);
  }
}

export class ActorSpawner {
  constructor(factory, registry) {
    this.factory = factory;
    this.registry = registry;
  }

  spawn(name = 'Actor') {
    const actor = this.factory.create(name);
    this.registry.register(actor);
    return actor;
  }
}

export class ActorDestroyer {
  constructor(factory, registry) {
    this.factory = factory;
    this.registry = registry;
  }

  destroy(actorId) {
    const actor = this.registry.get(actorId);
    if (actor) {
      this.registry.unregister(actorId);
      this.factory.recycle(actor);
    }
  }
}
