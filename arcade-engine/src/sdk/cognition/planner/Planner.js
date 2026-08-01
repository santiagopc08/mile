export class PlanStep {
  constructor(actionName, params = {}) {
    this.actionName = actionName;
    this.params = params;
  }
}

export class PlanCandidate {
  constructor(steps = [], cost = 1.0) {
    this.steps = steps;
    this.cost = cost;
  }
}

export class Plan {
  constructor(steps = []) {
    this.steps = steps;
    this.currentIndex = 0;
  }

  isComplete() { return this.currentIndex >= this.steps.length; }
}

export class Planner {
  createPlan(goal, context) {
    return new Plan();
  }
}
