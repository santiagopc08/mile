import { CLICommands } from './Commands.js';
import { ProjectGenerator } from '../generator/ProjectGenerator.js';
import { DocumentationGenerator } from '../documentation/DocumentationGenerator.js';

export class OrbitCli {
  static execute(args = []) {
    const command = args[0] || 'doctor';
    switch (command) {
      case 'create':
        return ProjectGenerator.generateProject(args[1] || 'my-arcade-game', args[2] || 'game');
      case 'build':
        return CLICommands.build(args[1] || 'current');
      case 'docs':
        return DocumentationGenerator.generateAllDocs();
      case 'doctor':
      default:
        return CLICommands.doctor();
    }
  }
}
