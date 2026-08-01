export class CLICommands {
  static create(projectName, template = 'game') {
    return { action: 'CREATE', projectName, template, success: true };
  }

  static build(projectName) {
    return { action: 'BUILD', projectName, success: true };
  }

  static doctor() {
    return { sdkVersion: '1.0.0', status: 'HEALTHY' };
  }
}

export class Scaffolding {
  static scaffoldFiles(projectName, templateData) {
    return { projectName, filesCreated: 5 };
  }
}
