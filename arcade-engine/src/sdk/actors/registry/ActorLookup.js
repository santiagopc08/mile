export class ActorLookup {
  constructor() {
    this.tagIndex = new Map(); // tag -> Set<Actor>
    this.groupIndex = new Map(); // group -> Set<Actor>
  }

  indexActor(actor) {
    actor.tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag).add(actor);
    });
    actor.groups.forEach((group) => {
      if (!this.groupIndex.has(group)) this.groupIndex.set(group, new Set());
      this.groupIndex.get(group).add(actor);
    });
  }

  unindexActor(actor) {
    actor.tags.forEach((tag) => {
      if (this.tagIndex.has(tag)) this.tagIndex.get(tag).delete(actor);
    });
    actor.groups.forEach((group) => {
      if (this.groupIndex.has(group)) this.groupIndex.get(group).delete(actor);
    });
  }

  getByTag(tag) {
    return Array.from(this.tagIndex.get(tag) || []);
  }

  getByGroup(group) {
    return Array.from(this.groupIndex.get(group) || []);
  }
}

export class ActorCollection {
  constructor() {
    this.actors = new Map();
  }

  add(actor) { this.actors.set(actor.id, actor); }
  get(id) { return this.actors.get(id) || null; }
  remove(id) { this.actors.delete(id); }
}
