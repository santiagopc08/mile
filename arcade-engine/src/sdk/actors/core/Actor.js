import { UUID } from '../../core/utils/UUID.js';
import { Transform2D } from '../../spatial/core/Transform2D.js';
import { ComponentCollection } from '../components/ActorComponent.js';
import { ActorState } from '../state/ActorState.js';

export class ActorId {
  constructor(id) {
    this.value = id || UUID.generate();
  }
}

export class ActorHandle {
  constructor(actor) {
    this.id = actor.id;
    this.actor = actor;
  }
}

export class Actor {
  constructor(id, name = 'Actor') {
    this.id = id || UUID.generate();
    this.name = name;
    this.transform = new Transform2D();
    this.components = new ComponentCollection();
    this.tags = new Set();
    this.groups = new Set();
    this.metadata = new Map();
    this.state = ActorState.CREATED;
  }

  addComponent(component) {
    this.components.add(component);
    component.onAttach(this);
    return component;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  removeComponent(name) {
    this.components.remove(name);
  }

  addTag(tag) {
    this.tags.add(tag);
  }

  hasTag(tag) {
    return this.tags.has(tag);
  }

  addGroup(group) {
    this.groups.add(group);
  }

  hasGroup(group) {
    return this.groups.has(group);
  }

  update(dt) {
    if (this.state !== ActorState.ACTIVE) return;
    this.components.components.forEach((comp) => {
      if (comp.enabled) comp.onUpdate(dt);
    });
  }
}
