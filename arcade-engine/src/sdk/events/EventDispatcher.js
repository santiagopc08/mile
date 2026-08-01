import { EventFilter } from './EventFilter.js';

export class EventDispatcher {
  constructor() {
    this.listeners = new Map(); // pattern -> Array<{ callback, priority, once }>
  }

  addListener(pattern, callback, priority = 200, once = false) {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, []);
    }
    const list = this.listeners.get(pattern);
    const entry = { callback, priority, once };
    list.push(entry);
    list.sort((a, b) => a.priority - b.priority);

    return () => this.removeListener(pattern, callback);
  }

  removeListener(pattern, callback) {
    if (!this.listeners.has(pattern)) return;
    const list = this.listeners.get(pattern);
    const idx = list.findIndex((item) => item.callback === callback);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  dispatch(eventContext) {
    this.listeners.forEach((list, pattern) => {
      if (EventFilter.matchesPattern(eventContext.name, pattern)) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (eventContext.propagationStopped) break;

          const item = list[i];
          item.callback(eventContext.payload, eventContext);

          if (item.once) {
            list.splice(i, 1);
          }
        }
      }
    });
  }

  clear() {
    this.listeners.clear();
  }
}
