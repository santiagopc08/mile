import { ValidationContext } from './ValidationContext.js';
import { ValidationReport } from './ValidationReport.js';
import { RuntimeScenario } from '../scenarios/RuntimeScenario.js';
import { ActorScenario } from '../scenarios/ActorScenario.js';
import { NavigationScenario } from '../scenarios/NavigationScenario.js';
import { InteractionScenario } from '../scenarios/InteractionScenario.js';
import { RenderingScenario } from '../scenarios/RenderingScenario.js';
import { PersistenceScenario } from '../scenarios/PersistenceScenario.js';
import { PluginScenario } from '../scenarios/PluginScenario.js';
import { BenchmarkRunner } from '../benchmarks/BenchmarkRunner.js';
import { ComplianceReport } from '../reports/ComplianceReport.js';
import { BenchmarkReport } from '../reports/BenchmarkReport.js';
import { ArchitectureReport } from '../reports/ArchitectureReport.js';

export class ValidationRunner {
  static runAllScenarios() {
    const report = new ValidationReport();
    const scenarios = [
      { name: 'Runtime', fn: RuntimeScenario.run },
      { name: 'Actor', fn: ActorScenario.run },
      { name: 'Navigation', fn: NavigationScenario.run },
      { name: 'Interaction', fn: InteractionScenario.run },
      { name: 'Rendering', fn: RenderingScenario.run },
      { name: 'Persistence', fn: PersistenceScenario.run },
      { name: 'Plugin', fn: PluginScenario.run },
    ];

    report.scenariosCount = scenarios.length;

    scenarios.forEach((sc) => {
      const ctx = new ValidationContext(sc.name);
      try {
        sc.fn(ctx);
      } catch (err) {
        ctx.passed = false;
        ctx.errors.push(err.message);
      }

      if (ctx.passed) {
        report.passedCount++;
      } else {
        report.failedCount++;
      }
      report.details.push(ctx);
    });

    return report;
  }
}

export class ValidationSuite {
  static runFullValidation() {
    const validationReport = ValidationRunner.runAllScenarios();
    const benchmarkResults = BenchmarkRunner.runAll();
    const compliance = ComplianceReport.generate(validationReport);
    const benchmarks = BenchmarkReport.generate(benchmarkResults);
    const architectureReport = ArchitectureReport.generate(compliance, benchmarks);
    return architectureReport;
  }
}
