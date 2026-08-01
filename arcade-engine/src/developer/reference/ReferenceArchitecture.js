export class ReferenceArchitecture {
  static getArchitectureGuide() {
    return 'Arcade Platform 20-IMP Architecture Specifications';
  }
}

export class ReferencePlugin {
  constructor(id = 'reference_plugin') {
    this.id = id;
  }
}

export class ReferenceRenderer {
  constructor(name = 'reference_renderer') {
    this.name = name;
  }
}

export class ReferenceApplication {
  constructor(id = 'reference_app') {
    this.id = id;
  }
}
