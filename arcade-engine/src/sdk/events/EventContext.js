import { UUID } from '../core/utils/UUID.js';
import { EventPriority } from './EventPriority.js';

export class EventContext {
  /**
   * @param {string} name 
   * @param {Object} [payload={}] 
   * @param {Object} [options={}] 
   */
  constructor(name, payload = {}, options = {}) {
    this.id = UUID.generate();
    this.name = name;
    this.payload = payload;
    this.timestamp = Date.now();
    this.priority = options.priority != null ? options.priority : EventPriority.NORMAL;
    this.source = options.source || 'SYSTEM';
    this.target = options.target || null;
    this.correlationId = options.correlationId || this.id;
    this.metadata = options.metadata || {};

    this.propagationStopped = false;
    this.defaultPrevented = false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}
