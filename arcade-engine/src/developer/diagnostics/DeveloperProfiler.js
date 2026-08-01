export class DeveloperMetrics {
  constructor() {
    this.totalProjectsGenerated = 0;
    this.totalDocsGenerated = 0;
  }
}

export class DeveloperProfiler {
  constructor() {
    this.metrics = new DeveloperMetrics();
  }

  getReport() {
    return {
      generatedProjects: this.metrics.totalProjectsGenerated,
    };
  }
}
