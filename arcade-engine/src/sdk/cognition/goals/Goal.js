export const GoalPriority = Object.freeze({
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
});

export class Goal {
  constructor(id, name, priority = GoalPriority.NORMAL) {
    this.id = id;
    this.name = name;
    this.priority = priority;
    this.completed = false;
  }
}

export class GoalSet {
  constructor() {
    this.goals = new Map();
  }

  add(goal) { this.goals.set(goal.id, goal); }
  getHighestPriorityGoal() {
    const list = Array.from(this.goals.values()).filter((g) => !g.completed);
    list.sort((a, b) => a.priority - b.priority);
    return list[0] || null;
  }
}

export class GoalEvaluator {
  static evaluate(goal, context) {
    return goal.completed;
  }
}
