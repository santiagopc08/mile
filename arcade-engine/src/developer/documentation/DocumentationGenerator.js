export class ApiDocumentation {
  static generateApiDocs() {
    return '# Arcade Engine API Reference Guide';
  }
}

export class ArchitectureGuide {
  static generateGuide() {
    return '# Arcade Engine 20-IMP Architectural Guide';
  }
}

export class TutorialGenerator {
  static generateTutorial(tutorialId = 'first-game') {
    return `# Tutorial: Building your ${tutorialId} with Arcade Engine`;
  }
}

export class DocumentationGenerator {
  static generateAllDocs() {
    return {
      api: ApiDocumentation.generateApiDocs(),
      guide: ArchitectureGuide.generateGuide(),
      tutorial: TutorialGenerator.generateTutorial('first-game'),
    };
  }
}
