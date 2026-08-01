export class ApplicationTemplate {
  constructor(name = 'app') {
    this.name = name;
  }
}

export class GameTemplate extends ApplicationTemplate {
  constructor() { super('game'); }
}

export class ToolTemplate extends ApplicationTemplate {
  constructor() { super('tool'); }
}

export class PluginTemplate extends ApplicationTemplate {
  constructor() { super('plugin'); }
}

export class RendererTemplate extends ApplicationTemplate {
  constructor() { super('renderer'); }
}
