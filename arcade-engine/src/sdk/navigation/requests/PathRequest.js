export const PathStatus = Object.freeze({
  PENDING: 'PENDING',
  SOLVED: 'SOLVED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

export class PathOptions {
  constructor(algorithm = 'ASTAR') {
    this.algorithm = algorithm;
  }
}

export class PathRequest {
  constructor(startNode, goalNode, options = new PathOptions()) {
    this.startNode = startNode;
    this.goalNode = goalNode;
    this.options = options;
    this.status = PathStatus.PENDING;
  }
}

export class PathResult {
  constructor(status = PathStatus.PENDING, path = [], cost = 0) {
    this.status = status;
    this.path = path;
    this.cost = cost;
  }
}
