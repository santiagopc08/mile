export class Migration {
  constructor(fromVersion, toVersion, upgradeFn) {
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
    this.upgradeFn = upgradeFn;
  }

  upgrade(data) {
    return this.upgradeFn ? this.upgradeFn(data) : data;
  }
}

export class MigrationRegistry {
  constructor() {
    this.migrations = [];
  }

  register(migration) {
    this.migrations.push(migration);
  }
}

export class MigrationRunner {
  static runMigrations(data, currentVersion, targetVersion, registry) {
    let result = data;
    registry.migrations.forEach((m) => {
      if (m.fromVersion === currentVersion) {
        result = m.upgrade(result);
        currentVersion = m.toVersion;
      }
    });
    return result;
  }
}
