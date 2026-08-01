export class FeatureFlags {
  constructor() {
    this.flags = new Map();
  }

  enable(flagName) {
    this.flags.set(flagName, true);
  }

  disable(flagName) {
    this.flags.set(flagName, false);
  }

  isEnabled(flagName, defaultValue = false) {
    return this.flags.has(flagName) ? this.flags.get(flagName) : defaultValue;
  }
}
