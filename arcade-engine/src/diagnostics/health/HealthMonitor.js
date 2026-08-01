export const HealthStatus = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
});

export class HealthCheck {
  constructor(name, checkFn) {
    this.name = name;
    this.checkFn = checkFn;
  }

  evaluate() {
    return this.checkFn ? this.checkFn() : true;
  }
}

export class HealthMonitor {
  constructor() {
    this.checks = new Map();
  }

  registerCheck(name, checkFn) {
    this.checks.set(name, new HealthCheck(name, checkFn));
  }

  getStatus() {
    let allHealthy = true;
    this.checks.forEach((chk) => {
      if (!chk.evaluate()) allHealthy = false;
    });
    return allHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
  }
}
