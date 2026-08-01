export class Reasoner {
  reason(knowledgeBase, context) {}
}

export class ReasoningModule {
  constructor(reasoner) {
    this.reasoner = reasoner;
  }
}

export class Evaluator {
  evaluateCandidates(candidates = []) {
    candidates.sort((a, b) => a.cost - b.cost);
    return candidates[0] || null;
  }
}

export class InferenceEngine {
  infer(knowledgeBase) {}
}
