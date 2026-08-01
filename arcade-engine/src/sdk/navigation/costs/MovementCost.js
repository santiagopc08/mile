export class MovementCost {
  static calculate(fromNode, toNode) {
    const dx = fromNode.x - toNode.x;
    const dy = fromNode.y - toNode.y;
    return Math.sqrt(dx * dx + dy * dy) * toNode.cost;
  }
}
