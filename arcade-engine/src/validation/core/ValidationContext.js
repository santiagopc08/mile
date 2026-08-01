export class ValidationContext {
  constructor(name = 'default') {
    this.name = name;
    this.passed = true;
    this.errors = [];
  }

  assert(condition, message) {
    if (!condition) {
      this.passed = false;
      this.errors.push(message);
    }
  }
}

export class ValidationReport {
  constructor() {
    this.scenariosCount = 0;
    this.passedCount = 0;
    this.failedCount = 0;
    this.details = [];
  }
}
