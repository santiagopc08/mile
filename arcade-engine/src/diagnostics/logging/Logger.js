export const LogLevel = Object.freeze({
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5,
});

export class LogEntry {
  constructor(level, message, context = {}, timestamp = Date.now()) {
    this.level = level;
    this.message = message;
    this.context = context;
    this.timestamp = timestamp;
  }
}

export class LogSink {
  write(entry) {}
}

export class ConsoleLogSink extends LogSink {
  write(entry) {
    if (entry.level >= LogLevel.ERROR) console.error(`[${entry.level}] ${entry.message}`, entry.context);
    else if (entry.level >= LogLevel.WARN) console.warn(`[${entry.level}] ${entry.message}`, entry.context);
    else console.log(`[${entry.level}] ${entry.message}`, entry.context);
  }
}

export class Logger {
  constructor(name = 'default', sinks = [new ConsoleLogSink()]) {
    this.name = name;
    this.sinks = sinks;
  }

  log(level, message, context = {}) {
    const entry = new LogEntry(level, message, context);
    this.sinks.forEach((s) => s.write(entry));
  }

  info(msg, ctx) { this.log(LogLevel.INFO, msg, ctx); }
  warn(msg, ctx) { this.log(LogLevel.WARN, msg, ctx); }
  error(msg, ctx) { this.log(LogLevel.ERROR, msg, ctx); }
}

export class TraceLogger extends Logger {}
