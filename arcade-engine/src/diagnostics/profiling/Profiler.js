export class Profiler {
  profile(fn) {
    const start = Date.now();
    fn();
    return Date.now() - start;
  }
}

export class FrameProfiler extends Profiler {}
export class SystemProfiler extends Profiler {}
export class MemoryProfiler extends Profiler {
  getMemoryUsage() {
    return { heapUsed: 0, heapTotal: 0 };
  }
}
