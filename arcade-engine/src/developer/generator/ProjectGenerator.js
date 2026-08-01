import { GameTemplate } from '../templates/GameTemplate.js';
import { ToolTemplate } from '../templates/ToolTemplate.js';

export class TemplateResolver {
  static resolve(templateName) {
    if (templateName === 'tool') return new ToolTemplate();
    return new GameTemplate();
  }
}

export class ProjectValidator {
  static validate(projectPath) {
    return { valid: true, errors: [] };
  }
}

export class CompatibilityValidator {
  static validateEngineVersion(version = '1.0.0') {
    return true;
  }
}

export class ProjectGenerator {
  static generateProject(projectName, templateName = 'game') {
    const template = TemplateResolver.resolve(templateName);
    return {
      projectName,
      template: template.name,
      manifest: { id: projectName, version: '1.0.0' },
      generated: true,
    };
  }
}
