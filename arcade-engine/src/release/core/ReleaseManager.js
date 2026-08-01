import { ArchitectureGate, PerformanceGate, CompatibilityGate, DocumentationGate, SecurityGate } from '../quality/QualityGate.js';
import { QualityReport } from '../reports/QualityReport.js';
import { CertificationReport } from '../reports/CertificationReport.js';
import { CompatibilityMatrix } from '../compatibility/CompatibilityMatrix.js';
import { PackageBuilder } from '../packaging/PackageBuilder.js';

export class ReleaseContext {
  constructor(version = '1.0.0') {
    this.version = version;
  }
}

export class ReleaseConfiguration {
  constructor(targetVersion = '1.0.0') {
    this.targetVersion = targetVersion;
  }
}

export class CertificationPipeline {
  static runCertification() {
    const gates = [
      new ArchitectureGate(),
      new PerformanceGate(),
      new CompatibilityGate(),
      new DocumentationGate(),
      new SecurityGate(),
    ];

    const results = gates.map((g) => g.evaluate());
    const qualityReport = QualityReport.generate(results);
    const matrix = CompatibilityMatrix.generateMatrix();
    return CertificationReport.generate(qualityReport, matrix);
  }
}

export class ReleaseManager {
  constructor(version = '1.0.0') {
    this.version = version;
  }

  certifyRelease() {
    const certReport = CertificationPipeline.runCertification();
    const pkg = PackageBuilder.buildPackage(this.version);
    return {
      certified: certReport.certified,
      report: certReport,
      package: pkg,
    };
  }
}
