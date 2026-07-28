/**
 * Generic reusable Object Pool to prevent frame-loop heap allocations.
 */
export class ObjectPool {
  /**
   * @param {Function} factory - Function creating a new object instance
   * @param {Function} [reset] - Optional function to reset object state on release
   * @param {number} [initialSize=16] - Initial pool pre-allocation size
   */
  constructor(factory, reset = null, initialSize = 16) {
    this.factory = factory;
    this.reset = reset;
    /** @type {any[]} */
    this.pool = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Acquire an object instance from the pool.
   * @returns {any}
   */
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }

  /**
   * Release an object instance back to the pool.
   * @param {any} item 
   */
  release(item) {
    if (item === null || item === undefined) return;
    if (this.reset) {
      this.reset(item);
    }
    this.pool.push(item);
  }

  /**
   * Pre-warm pool capacity.
   * @param {number} count 
   */
  expand(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  clear() {
    this.pool.length = 0;
  }
}
