export class ValidationProfiler {
  constructor() {
    this.totalRuns = 0;
  }
}

export class ValidationDashboard {
  constructor(suiteReport = null) {
    this.suiteReport = suiteReport;
  }

  getSummary() {
    return {
      status: this.suiteReport && this.suiteReport.architectureVerified ? 'VERIFIED' : 'PENDING',
    };
  }
}
