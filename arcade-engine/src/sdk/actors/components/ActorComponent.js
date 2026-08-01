export class ActorComponent {
  constructor(name = 'Component') {
    this.name = name;
    this.owner = null;
    this.enabled = true;
  }

  onAttach(actor) {
    this.owner = actor;
  }

  onDetach() {
    this.owner = null;
  }

  onUpdate(dt) {}
}

export class ComponentDescriptor {
  constructor(type, factoryFn) {
    this.type = type;
    this.factoryFn = factoryFn;
  }
}

export class ComponentCollection {
  constructor() {
    this.components = new Map();
  }

  add(component) {
    this.components.set(component.name, component);
  }

  get(name) {
    return this.components.get(name) || null;
  }

  remove(name) {
    if (this.components.has(name)) {
      const comp = this.components.get(name);
      comp.onDetach();
      this.components.delete(name);
    }
  }
}

export class ComponentRegistry {
  constructor() {
    this.registry = new Map();
  }
}
