export class ManifestVersion {
  static isValidVersion(version) {
    if (typeof version !== 'string') return false;
    return /^\d+\.\d+\.\d+$/.test(version);
  }
}
