import { MetricsRegistry } from '../metrics/MetricsRegistry.js';
import { Logger } from '../logging/Logger.js';
import { TraceCollector } from '../tracing/TraceCollector.js';
import { HealthMonitor } from '../health/HealthMonitor.js';

export class TelemetryPipeline {
  constructor() {
    this.metrics = new MetricsRegistry();
    this.logger = new Logger();
    this.tracer = new TraceCollector();
  }
}

export class DiagnosticsConfiguration {
  constructor(enabled = true) {
    this.enabled = enabled;
  }
}

export class DiagnosticsContext {
  constructor(config = new DiagnosticsConfiguration()) {
    this.config = config;
  }
}

export class DiagnosticsManager {
  constructor() {
    this.pipeline = new TelemetryPipeline();
    this.healthMonitor = new HealthMonitor();
    this.enabled = true;
  }

  getMetrics() { return this.pipeline.metrics; }
  getLogger() { return this.pipeline.logger; }
  getTracer() { return this.pipeline.tracer; }
}
