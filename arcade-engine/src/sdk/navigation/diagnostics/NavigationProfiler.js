export class NavigationMetrics {
  constructor() {
    this.totalPathsCalculated = 0;
    this.totalPathsFailed = 0;
  }
}

export class NavigationProfiler {
  constructor(navigationSystem) {
    this.navigationSystem = navigationSystem;
    this.metrics = new NavigationMetrics();
  }

  getReport() {
    return {
      nodesCount: this.navigationSystem ? this.navigationSystem.graph.nodes.nodes.size : 0,
      edgesCount: this.navigationSystem ? this.navigationSystem.graph.edges.edges.length : 0,
    };
  }
}
