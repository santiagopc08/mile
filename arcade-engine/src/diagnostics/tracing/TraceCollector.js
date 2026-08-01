export class Span {
  constructor(name, parentId = null) {
    this.name = name;
    this.parentId = parentId;
    this.startTime = Date.now();
    this.endTime = 0;
    this.attributes = {};
  }

  end() {
    this.endTime = Date.now();
  }
}

export class Trace {
  constructor(id) {
    this.id = id;
    this.spans = [];
  }
}

export class TraceContext {
  constructor(traceId) {
    this.traceId = traceId;
  }
}

export class TraceCollector {
  constructor() {
    this.spans = [];
  }

  startSpan(name, parentId = null) {
    const span = new Span(name, parentId);
    this.spans.push(span);
    return span;
  }
}
