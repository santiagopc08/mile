export class Diagnostics {
  constructor(serviceRegistry) {
    this.serviceRegistry = serviceRegistry;
    this.startupTime = Date.now();
  }

  getMetrics() {
    return {
      startupTimeMs: Date.now() - this.startupTime,
      registeredServices: this.serviceRegistry ? this.serviceRegistry.container.services.size : 0,
      activeSingletons: this.serviceRegistry ? this.serviceRegistry.container.instances.size : 0,
      memoryUsage: typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : null,
    };
  }
}
