export class TraversalRule {
  static canTraverse(fromNode, toNode) {
    return toNode.walkable;
  }
}

export class TerrainCost {
  constructor(multiplier = 1.0) {
    this.multiplier = multiplier;
  }
}

export class ObstacleMap {
  constructor() {
    this.obstacles = new Set();
  }

  add(nodeId) { this.obstacles.add(nodeId); }
  remove(nodeId) { this.obstacles.delete(nodeId); }
  has(nodeId) { return this.obstacles.has(nodeId); }
}

export class DynamicObstacle {
  constructor(id, nodeIds = []) {
    this.id = id;
    this.nodeIds = nodeIds;
  }
}
