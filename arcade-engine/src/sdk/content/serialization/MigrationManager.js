export class MigrationManager {
  constructor() {
    this.migrations = new Map(); // "pluginId:fromVersion->toVersion" -> fn
  }

  registerMigration(pluginId, fromVersion, toVersion, migrationFn) {
    const key = `${pluginId}:${fromVersion}->${toVersion}`;
    this.migrations.set(key, migrationFn);
  }

  migrate(pluginId, saveData, currentVersion) {
    const fromVer = saveData.header ? saveData.header.version : '1.0.0';
    if (fromVer === currentVersion) return saveData;

    const key = `${pluginId}:${fromVer}->${currentVersion}`;
    if (this.migrations.has(key)) {
      const fn = this.migrations.get(key);
      return fn(saveData);
    }
    return saveData;
  }
}
