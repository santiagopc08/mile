export class InteractionRule {
  constructor(tagA, tagB, actionFn) {
    this.tagA = tagA;
    this.tagB = tagB;
    this.actionFn = actionFn;
  }
}

export class InteractionPolicy {
  constructor() {
    this.rules = [];
  }

  addRule(rule) {
    this.rules.push(rule);
  }
}

export class InteractionResolver {
  constructor(policy) {
    this.policy = policy;
  }

  resolve(entityA, entityB) {
    if (!this.policy) return;
    this.policy.rules.forEach((rule) => {
      if (entityA.tags.has(rule.tagA) && entityB.tags.has(rule.tagB)) {
        rule.actionFn(entityA, entityB);
      }
    });
  }
}
