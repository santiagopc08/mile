import { AStar } from '../algorithms/AStar.js';
import { BreadthFirst } from '../algorithms/BreadthFirst.js';
import { Dijkstra } from '../algorithms/Dijkstra.js';
import { PathResult } from '../requests/PathRequest.js';
import { PathStatus } from '../requests/PathRequest.js';
import { PathCache } from '../cache/PathCache.js';

export class NavigationService {
  constructor(graph) {
    this.graph = graph;
    this.cache = new PathCache();
  }

  solvePath(startNode, goalNode, algorithm = 'ASTAR') {
    if (!startNode || !goalNode) return new PathResult(PathStatus.FAILED);

    const cached = this.cache.get(startNode.id, goalNode.id);
    if (cached) return new PathResult(PathStatus.SOLVED, cached);

    let path = [];
    if (algorithm === 'BFS') {
      path = BreadthFirst.findPath(this.graph, startNode, goalNode);
    } else if (algorithm === 'DIJKSTRA') {
      path = Dijkstra.findPath(this.graph, startNode, goalNode);
    } else {
      path = AStar.findPath(this.graph, startNode, goalNode);
    }

    if (path.length > 0) {
      this.cache.set(startNode.id, goalNode.id, path);
      return new PathResult(PathStatus.SOLVED, path);
    }

    return new PathResult(PathStatus.FAILED);
  }
}
