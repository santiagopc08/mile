export class NodeCollection {
  constructor() {
    this.nodes = new Map();
  }

  add(node) {
    this.nodes.set(node.id, node);
  }

  get(id) {
    return this.nodes.get(id) || null;
  }
}
