export class RenderPass {
  constructor(name = 'default') {
    this.name = name;
  }
}

export class RenderNode {
  constructor(name) {
    this.name = name;
    this.pass = new RenderPass(name);
  }
}

export class RenderStage {
  constructor(name) {
    this.name = name;
  }
}

export class RenderGraph {
  constructor() {
    this.nodes = new Map();
  }

  addNode(node) {
    this.nodes.set(node.name, node);
  }
}
