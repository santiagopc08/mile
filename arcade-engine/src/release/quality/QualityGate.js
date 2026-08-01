export class QualityGate {
  constructor(name) {
    this.name = name;
  }

  evaluate() {
    return { name: this.name, passed: true, score: 100 };
  }
}

export class ArchitectureGate extends QualityGate {
  constructor() { super('ArchitectureGate'); }
}

export class PerformanceGate extends QualityGate {
  constructor() { super('PerformanceGate'); }
}

export class CompatibilityGate extends QualityGate {
  constructor() { super('CompatibilityGate'); }
}

export class DocumentationGate extends QualityGate {
  constructor() { super('DocumentationGate'); }
}

export class SecurityGate extends QualityGate {
  constructor() { super('SecurityGate'); }
}
