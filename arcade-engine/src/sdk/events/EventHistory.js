export class EventHistory {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.buffer = [];
  }

  add(eventContext) {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push({
      name: eventContext.name,
      timestamp: eventContext.timestamp,
      priority: eventContext.priority,
      source: eventContext.source,
    });
  }

  getHistory() {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}
