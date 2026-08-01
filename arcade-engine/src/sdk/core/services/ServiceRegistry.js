import { DependencyContainer, Lifetime } from './DependencyContainer.js';
import { DependencyError } from '../errors/SDKError.js';

export class ServiceRegistry {
  constructor() {
    this.container = new DependencyContainer();
  }

  register(token, provider, lifetime = Lifetime.SINGLETON) {
    this.container.register(token, provider, lifetime);
  }

  get(token) {
    return this.container.resolve(token);
  }

  has(token) {
    return this.container.has(token);
  }

  unregister(token) {
    if (this.container.has(token)) {
      const inst = this.container.instances.get(token);
      if (inst && typeof inst.dispose === 'function') inst.dispose();
      this.container.services.delete(token);
      this.container.instances.delete(token);
    }
  }

  dispose() {
    this.container.clear();
  }
}
