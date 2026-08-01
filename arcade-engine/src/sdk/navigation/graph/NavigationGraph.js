import { NodeCollection } from './NodeCollection.js';
import { EdgeCollection } from './EdgeCollection.js';

export class NavigationGraph {
  constructor() {
    this.nodes = new NodeCollection();
    this.edges = new EdgeCollection();
  }

  addNode(node) {
    this.nodes.add(node);
  }

  addEdge(edge) {
    this.edges.add(edge);
    if (edge.source && edge.target) {
      edge.source.neighbors.push(edge.target);
    }
  }

  getNode(id) {
    return this.nodes.get(id);
  }
}
