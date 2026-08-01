export class Fact {
  constructor(subject, predicate, object) {
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
  }
}

export class Belief {
  constructor(fact, probability = 1.0) {
    this.fact = fact;
    this.probability = probability;
  }
}

export class WorldModel {
  constructor() {
    this.state = new Map();
  }
}

export class KnowledgeBase {
  constructor() {
    this.facts = new Set();
    this.beliefs = new Map();
  }

  addFact(fact) { this.facts.add(fact); }
  addBelief(belief) { this.beliefs.set(`${belief.fact.subject}:${belief.fact.predicate}`, belief); }
}
