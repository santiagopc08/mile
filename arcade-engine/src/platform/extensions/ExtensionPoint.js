export class ExtensionPoint {
  constructor(name, contract = {}) {
    this.name = name;
    this.contract = contract;
    this.providers = [];
  }

  addProvider(provider) {
    this.providers.push(provider);
  }
}

export class ExtensionProvider {
  constructor(name, implementation) {
    this.name = name;
    this.implementation = implementation;
  }
}

export class ExtensionRegistry {
  constructor() {
    this.extensionPoints = new Map();
  }

  registerPoint(name, contract) {
    const point = new ExtensionPoint(name, contract);
    this.extensionPoints.set(name, point);
    return point;
  }

  getPoint(name) {
    return this.extensionPoints.get(name) || null;
  }
}
