export class ApplicationLookup {
  constructor() {
    this.index = new Map();
  }

  add(app) { this.index.set(app.id, app); }
  get(id) { return this.index.get(id) || null; }
  remove(id) { this.index.delete(id); }
}

export class ApplicationCollection {
  constructor() {
    this.lookup = new ApplicationLookup();
  }
}

export class ApplicationRegistry {
  constructor() {
    this.collection = new ApplicationCollection();
  }

  register(app) {
    this.collection.lookup.add(app);
  }

  unregister(appId) {
    this.collection.lookup.remove(appId);
  }

  get(appId) {
    return this.collection.lookup.get(appId);
  }
}
