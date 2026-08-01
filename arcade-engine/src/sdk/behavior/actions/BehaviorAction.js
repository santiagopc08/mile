export class BehaviorAction {
  constructor(name = 'Action') {
    this.name = name;
    this.completed = false;
    this.cancelled = false;
  }

  execute(context) {}
  cancel() { this.cancelled = true; }
}

export class CompositeAction extends BehaviorAction {
  constructor(name = 'CompositeAction', actions = []) {
    super(name);
    this.actions = actions;
  }
}

export class SequentialAction extends CompositeAction {
  constructor(actions = []) {
    super('SequentialAction', actions);
    this.currentIndex = 0;
  }

  execute(context) {
    if (this.completed || this.cancelled) return;
    if (this.currentIndex < this.actions.length) {
      const currentAction = this.actions[this.currentIndex];
      currentAction.execute(context);
      if (currentAction.completed) {
        this.currentIndex++;
      }
    }
    if (this.currentIndex >= this.actions.length) {
      this.completed = true;
    }
  }
}

export class ParallelAction extends CompositeAction {
  constructor(actions = []) {
    super('ParallelAction', actions);
  }

  execute(context) {
    if (this.completed || this.cancelled) return;
    let allFinished = true;
    this.actions.forEach((act) => {
      if (!act.completed && !act.cancelled) {
        act.execute(context);
        if (!act.completed) allFinished = false;
      }
    });
    if (allFinished) this.completed = true;
  }
}

export class ConditionalAction extends BehaviorAction {
  constructor(predicateFn, action) {
    super('ConditionalAction');
    this.predicateFn = predicateFn;
    this.action = action;
  }

  execute(context) {
    if (this.predicateFn(context)) {
      this.action.execute(context);
      this.completed = this.action.completed;
    } else {
      this.completed = true;
    }
  }
}
