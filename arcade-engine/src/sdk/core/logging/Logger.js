/**
 * Log Level Enum.
 */
export const LogLevel = Object.freeze({
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  NONE: 6,
});

/**
 * Decoupled Logger supporting multi-sink dispatching.
 */
export class Logger {
  constructor(name = 'Core', level = LogLevel.INFO) {
    this.name = name;
    this.level = level;
    this.sinks = [];
    this.addSink((msg) => this._defaultConsoleSink(msg));
  }

  addSink(sinkFn) {
    this.sinks.push(sinkFn);
  }

  trace(message, details = {}) {
    this._log(LogLevel.TRACE, message, details);
  }

  debug(message, details = {}) {
    this._log(LogLevel.DEBUG, message, details);
  }

  info(message, details = {}) {
    this._log(LogLevel.INFO, message, details);
  }

  warn(message, details = {}) {
    this._log(LogLevel.WARN, message, details);
  }

  error(message, details = {}) {
    this._log(LogLevel.ERROR, message, details);
  }

  fatal(message, details = {}) {
    this._log(LogLevel.FATAL, message, details);
  }

  _log(level, message, details) {
    if (level < this.level) return;
    const entry = {
      name: this.name,
      level,
      message,
      details,
      timestamp: Date.now(),
    };
    this.sinks.forEach((sink) => sink(entry));
  }

  _defaultConsoleSink(entry) {
    const timeStr = new Date(entry.timestamp).toISOString().split('T')[1].slice(0, 8);
    const prefix = `[${timeStr}] [${entry.name}]`;

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(`${prefix} [DEBUG] ${entry.message}`, entry.details);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} [INFO] ${entry.message}`, entry.details);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} [WARN] ${entry.message}`, entry.details);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix} [ERROR] ${entry.message}`, entry.details);
        break;
    }
  }
}
