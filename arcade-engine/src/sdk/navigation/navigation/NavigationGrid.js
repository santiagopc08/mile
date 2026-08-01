import { NavigationGraph } from '../graph/NavigationGraph.js';
import { NavigationNode } from '../graph/NavigationNode.js';
import { NavigationEdge } from '../graph/NavigationEdge.js';

export class NavigationGrid {
  static createGraphFromGrid(grid) {
    const graph = new NavigationGraph();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const id = `${x},${y}`;
        graph.addNode(new NavigationNode(id, x, y));
      }
    }
    // Connect 4-way neighbors
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const source = graph.getNode(`${x},${y}`);
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        dirs.forEach(([dx, dy]) => {
          const target = graph.getNode(`${x + dx},${y + dy}`);
          if (target) {
            graph.addEdge(new NavigationEdge(source, target, 1.0));
          }
        });
      }
    }
    return graph;
  }
}

export class NavigationRegion {
  constructor(id) {
    this.id = id;
  }
}
