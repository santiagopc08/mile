export class NavigationNode {
  constructor(id, x, y, cost = 1.0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.cost = cost;
    this.neighbors = [];
    this.walkable = true;
  }
}
