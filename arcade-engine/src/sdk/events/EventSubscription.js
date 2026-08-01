export class EventSubscription {
  /**
   * @param {string} pattern 
   * @param {Function} callback 
   * @param {Function} unsubscribeFn 
   */
  constructor(pattern, callback, unsubscribeFn) {
    this.pattern = pattern;
    this.callback = callback;
    this.unsubscribeFn = unsubscribeFn;
    this.active = true;
  }

  unsubscribe() {
    if (this.active && this.unsubscribeFn) {
      this.active = false;
      this.unsubscribeFn();
    }
  }
}
