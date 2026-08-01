export class Inspector {
  inspect(target) { return target; }
}

export class ObjectInspector extends Inspector {}
export class SystemInspector extends Inspector {}
export class RuntimeInspector extends Inspector {
  inspectRuntime(runtime) {
    return {
      state: runtime ? runtime.lifecycle.state : 'UNKNOWN',
      frameCount: runtime ? runtime.frameCount : 0,
    };
  }
}
