export class ReferenceCounter {
  constructor() {
    this.counts = new Map();
  }

  acquire(key) {
    const current = this.counts.get(key) || 0;
    this.counts.set(key, current + 1);
    return current + 1;
  }

  release(key) {
    const current = this.counts.get(key) || 0;
    const next = Math.max(0, current - 1);
    this.counts.set(key, next);
    return next;
  }

  get(key) {
    return this.counts.get(key) || 0;
  }
}
