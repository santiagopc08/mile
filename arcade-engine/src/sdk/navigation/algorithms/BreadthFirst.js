export class BreadthFirst {
  static findPath(graph, startNode, goalNode) {
    if (!startNode || !goalNode) return [];
    const frontier = [startNode];
    const cameFrom = new Map();
    cameFrom.set(startNode.id, null);

    while (frontier.length > 0) {
      const current = frontier.shift();
      if (current.id === goalNode.id) break;

      for (const next of current.neighbors) {
        if (next.walkable && !cameFrom.has(next.id)) {
          frontier.push(next);
          cameFrom.set(next.id, current);
        }
      }
    }

    if (!cameFrom.has(goalNode.id)) return [];

    const path = [];
    let curr = goalNode;
    while (curr) {
      path.unshift(curr);
      curr = cameFrom.get(curr.id);
    }
    return path;
  }
}
