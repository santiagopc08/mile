export class AnimationController {
  constructor(graph) {
    this.graph = graph;
    this.currentNode = null;
    this.currentTime = 0;
  }

  play(nodeName) {
    if (this.graph && this.graph.nodes.has(nodeName)) {
      this.currentNode = this.graph.nodes.get(nodeName);
      this.currentTime = 0;
    }
  }

  update(dt) {
    if (!this.currentNode) return;
    this.currentTime += dt;

    if (this.graph) {
      for (const transition of this.graph.transitions) {
        if (transition.fromNode === this.currentNode.name && transition.canTransition(this.graph.parameters)) {
          this.play(transition.toNode);
          break;
        }
      }
    }
  }
}

export class PresentationController {
  constructor() {}
}
