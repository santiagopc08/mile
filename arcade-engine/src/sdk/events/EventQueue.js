export class EventQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(eventContext) {
    this.queue.push(eventContext);
    // Sort by priority ASC (0 = Critical, 400 = Background)
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  clear() {
    this.queue = [];
  }
}
