export class Metric {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}

export class Counter extends Metric {
  constructor(name) {
    super(name, 'COUNTER');
    this.value = 0;
  }

  inc(amount = 1) { this.value += amount; }
}

export class Gauge extends Metric {
  constructor(name) {
    super(name, 'GAUGE');
    this.value = 0;
  }

  set(value) { this.value = value; }
}

export class Histogram extends Metric {
  constructor(name) {
    super(name, 'HISTOGRAM');
    this.samples = [];
  }

  observe(val) { this.samples.push(val); }
}

export class Timer extends Metric {
  constructor(name) {
    super(name, 'TIMER');
    this.startTime = 0;
    this.duration = 0;
  }

  start() { this.startTime = Date.now(); }
  stop() { this.duration = Date.now() - this.startTime; return this.duration; }
}

export class MetricsRegistry {
  constructor() {
    this.metrics = new Map();
  }

  counter(name) {
    if (!this.metrics.has(name)) this.metrics.set(name, new Counter(name));
    return this.metrics.get(name);
  }

  gauge(name) {
    if (!this.metrics.has(name)) this.metrics.set(name, new Gauge(name));
    return this.metrics.get(name);
  }
}
