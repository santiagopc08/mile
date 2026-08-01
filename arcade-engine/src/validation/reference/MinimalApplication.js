import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';

export class MinimalApplication extends Application {
  constructor() {
    super(new ApplicationManifest({ id: 'minimal_app', name: 'Minimal Application', version: '1.0.0' }));
  }
}

export class MinimalGame extends Application {
  constructor() {
    super(new ApplicationManifest({ id: 'minimal_game', name: 'Minimal Game Reference', version: '1.0.0' }));
  }
}

export class SandboxApplication extends Application {
  constructor() {
    super(new ApplicationManifest({ id: 'sandbox_app', name: 'Sandbox Reference App', version: '1.0.0' }));
  }
}

export class ToolApplication extends Application {
  constructor() {
    super(new ApplicationManifest({ id: 'tool_app', name: 'Diagnostic Tool Reference', version: '1.0.0' }));
  }
}
