export class ApplicationManifest {
  constructor(data = {}) {
    this.id = data.id || 'unknown_app';
    this.name = data.name || 'Unnamed Application';
    this.version = data.version || '1.0.0';
    this.description = data.description || '';
    this.dependencies = data.dependencies || {};
    this.permissions = data.permissions || [];
    this.entryPoint = data.entryPoint || 'index.js';
    this.assets = data.assets || [];
  }
}

export class ManifestParser {
  static parse(jsonContent) {
    const raw = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    if (!raw.id || !raw.version) {
      throw new Error('Manifest missing mandatory id or version.');
    }
    return new ApplicationManifest(raw);
  }
}
