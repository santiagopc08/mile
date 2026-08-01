export class AnimationCondition {
  constructor(paramName, expectedValue) {
    this.paramName = paramName;
    this.expectedValue = expectedValue;
  }

  evaluate(parameters) {
    const param = parameters.get(this.paramName);
    return param ? param.value === this.expectedValue : false;
  }
}

export class AnimationTransition {
  constructor(fromNode, toNode, conditions = []) {
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.conditions = conditions;
  }

  canTransition(parameters) {
    return this.conditions.every((c) => c.evaluate(parameters));
  }
}

export class AnimationNode {
  constructor(name, clipName, duration = 1.0, loop = true) {
    this.name = name;
    this.clipName = clipName;
    this.duration = duration;
    this.loop = loop;
  }
}

export class AnimationGraph {
  constructor() {
    this.nodes = new Map();
    this.transitions = [];
    this.parameters = new Map();
  }

  addNode(node) {
    this.nodes.set(node.name, node);
  }

  addTransition(transition) {
    this.transitions.push(transition);
  }

  addParameter(parameter) {
    this.parameters.set(parameter.name, parameter);
  }
}
