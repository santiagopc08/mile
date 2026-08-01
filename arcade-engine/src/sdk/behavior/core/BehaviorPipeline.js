export class BehaviorPipeline {
  constructor(actions = []) {
    this.actions = actions;
    this.completed = false;
  }

  execute(context) {
    if (this.completed) return;
    let allDone = true;
    this.actions.forEach((act) => {
      if (!act.completed) {
        act.execute(context);
        if (!act.completed) allDone = false;
      }
    });
    if (allDone) this.completed = true;
  }

  cancel() {
    this.actions.forEach((act) => act.cancel());
    this.completed = true;
  }
}

export class BehaviorScheduler {
  constructor() {
    this.pipelines = [];
  }

  schedule(pipeline) {
    this.pipelines.push(pipeline);
  }

  update(context) {
    for (let i = this.pipelines.length - 1; i >= 0; i--) {
      const p = this.pipelines[i];
      p.execute(context);
      if (p.completed) {
        this.pipelines.splice(i, 1);
      }
    }
  }
}
