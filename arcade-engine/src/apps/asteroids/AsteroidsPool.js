/**
 * EntityPool — reusable object pool for high-frequency actors (Bullets, Particles).
 */
export class EntityPool {
  /**
   * @param {Function} factoryFn - Function that instantiates a new actor.
   * @param {number} initialSize - Number of pre-allocated instances.
   */
  constructor(factoryFn, initialSize = 20) {
    this.factoryFn = factoryFn;
    this.pool = [];
    this.active = new Set();

    for (let i = 0; i < initialSize; i++) {
      const instance = this.factoryFn(i);
      instance.active = false;
      this.pool.push(instance);
    }
  }

  /**
   * Acquire an instance from the pool (or create a new one if exhausted).
   */
  acquire() {
    let instance = this.pool.pop();
    if (!instance) {
      instance = this.factoryFn(this.active.size + this.pool.length);
    }
    instance.active = true;
    this.active.add(instance);
    return instance;
  }

  /**
   * Release an instance back to the pool.
   * @param {any} instance
   */
  release(instance) {
    if (this.active.has(instance)) {
      this.active.delete(instance);
      instance.active = false;
      this.pool.push(instance);
    }
  }

  /**
   * Release all currently active instances.
   */
  releaseAll() {
    for (const instance of this.active) {
      instance.active = false;
      this.pool.push(instance);
    }
    this.active.clear();
  }

  getActiveCount() {
    return this.active.size;
  }

  getPoolSize() {
    return this.pool.length;
  }
}
