import { DependencyError } from '../errors/SDKError.js';

export const Lifetime = Object.freeze({
  SINGLETON: 'SINGLETON',
  FACTORY: 'FACTORY',
  LAZY: 'LAZY',
});

export class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
    this.resolvingStack = new Set();
  }

  register(token, factoryOrClass, lifetime = Lifetime.SINGLETON) {
    this.services.set(token, { factoryOrClass, lifetime });
  }

  resolve(token) {
    if (!this.services.has(token)) {
      throw new DependencyError(`Service token '${String(token)}' is not registered.`);
    }

    if (this.resolvingStack.has(token)) {
      const cycle = Array.from(this.resolvingStack).concat(token).join(' -> ');
      throw new DependencyError(`Dependency cycle detected: ${cycle}`);
    }

    const { factoryOrClass, lifetime } = this.services.get(token);

    if (lifetime === Lifetime.SINGLETON && this.instances.has(token)) {
      return this.instances.get(token);
    }

    this.resolvingStack.add(token);
    let instance;

    try {
      if (typeof factoryOrClass === 'function') {
        try {
          instance = new factoryOrClass(this);
        } catch (e) {
          instance = factoryOrClass(this);
        }
      } else {
        instance = factoryOrClass;
      }
    } finally {
      this.resolvingStack.delete(token);
    }

    if (lifetime === Lifetime.SINGLETON) {
      this.instances.set(token, instance);
    }

    return instance;
  }

  has(token) {
    return this.services.has(token);
  }

  clear() {
    this.instances.forEach((inst) => {
      if (inst && typeof inst.dispose === 'function') inst.dispose();
      if (inst && typeof inst.destroy === 'function') inst.destroy();
    });
    this.services.clear();
    this.instances.clear();
    this.resolvingStack.clear();
  }
}
