export class Dijkstra {
  static findPath(graph, startNode, goalNode) {
    if (!startNode || !goalNode) return [];
    const frontier = [{ node: startNode, cost: 0 }];
    const cameFrom = new Map();
    const costSoFar = new Map();

    cameFrom.set(startNode.id, null);
    costSoFar.set(startNode.id, 0);

    while (frontier.length > 0) {
      frontier.sort((a, b) => a.cost - b.cost);
      const { node: current } = frontier.shift();

      if (current.id === goalNode.id) break;

      for (const next of current.neighbors) {
        if (!next.walkable) continue;
        const newCost = costSoFar.get(current.id) + next.cost;
        if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)) {
          costSoFar.set(next.id, newCost);
          cameFrom.set(next.id, current);
          frontier.push({ node: next, cost: newCost });
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
