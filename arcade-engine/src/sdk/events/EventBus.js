import { EventDispatcher } from './EventDispatcher.js';
import { EventQueue } from './EventQueue.js';
import { EventContext } from './EventContext.js';
import { EventSubscription } from './EventSubscription.js';
import { EventMetrics } from './EventMetrics.js';
import { EventHistory } from './EventHistory.js';
import { EventPriority } from './EventPriority.js';

export class EventBus {
  constructor() {
    this.dispatcher = new EventDispatcher();
    this.queue = new EventQueue();
    this.metrics = new EventMetrics();
    this.history = new EventHistory();
  }

  subscribe(pattern, callback, priority = EventPriority.NORMAL) {
    const unbind = this.dispatcher.addListener(pattern, callback, priority, false);
    this.metrics.listenersCount++;
    return new EventSubscription(pattern, callback, () => {
      unbind();
      this.metrics.listenersCount = Math.max(0, this.metrics.listenersCount - 1);
    });
  }

  once(pattern, callback, priority = EventPriority.NORMAL) {
    const unbind = this.dispatcher.addListener(pattern, callback, priority, true);
    this.metrics.listenersCount++;
    return new EventSubscription(pattern, callback, () => {
      unbind();
      this.metrics.listenersCount = Math.max(0, this.metrics.listenersCount - 1);
    });
  }

  emit(eventName, payload = {}, options = {}) {
    const ctx = new EventContext(eventName, payload, options);
    this.metrics.recordEmit();
    this.history.add(ctx);

    if (options.queued) {
      this.queue.enqueue(ctx);
    } else {
      this._processEvent(ctx);
    }
    return ctx;
  }

  processQueue() {
    while (!this.queue.isEmpty()) {
      const ctx = this.queue.dequeue();
      if (ctx) this._processEvent(ctx);
    }
  }

  _processEvent(ctx) {
    this.metrics.recordDispatch();
    this.dispatcher.dispatch(ctx);
    if (ctx.propagationStopped) {
      this.metrics.recordCancel();
    }
  }

  clear() {
    this.dispatcher.clear();
    this.queue.clear();
    this.history.clear();
  }
}
