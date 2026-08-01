export class NavigationEdge {
  constructor(source, target, weight = 1.0) {
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.enabled = true;
  }
}
