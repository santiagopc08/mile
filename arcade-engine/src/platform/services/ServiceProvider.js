export class ServiceProvider {
  constructor() {
    this.services = new Map();
  }

  register(name, serviceInstance) {
    this.services.set(name, serviceInstance);
  }

  get(name) {
    return this.services.get(name) || null;
  }
}

export class ServiceScope {
  constructor(name = 'app') {
    this.name = name;
    this.provider = new ServiceProvider();
  }
}

export class ServiceInjector {
  constructor(globalProvider) {
    this.globalProvider = globalProvider || new ServiceProvider();
  }

  inject(target, serviceName) {
    target[serviceName] = this.globalProvider.get(serviceName);
  }
}
