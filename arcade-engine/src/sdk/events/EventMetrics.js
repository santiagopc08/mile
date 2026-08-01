export class EventMetrics {
  constructor() {
    this.totalEmitted = 0;
    this.totalDispatched = 0;
    this.totalCancelled = 0;
    this.listenersCount = 0;
    this.startTime = Date.now();
  }

  recordEmit() {
    this.totalEmitted++;
  }

  recordDispatch() {
    this.totalDispatched++;
  }

  recordCancel() {
    this.totalCancelled++;
  }

  getEventsPerMinute() {
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    return elapsedMinutes > 0 ? Math.round(this.totalEmitted / elapsedMinutes) : this.totalEmitted;
  }
}
