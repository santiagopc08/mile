import { CoreConstants } from '../CoreConstants.js';

export class Version {
  static getSDKVersion() {
    return CoreConstants.SDK_VERSION;
  }

  static getMinEngineVersion() {
    return CoreConstants.MIN_ENGINE_VERSION;
  }

  static isEngineCompatible(engineVersion) {
    if (!engineVersion) return false;
    const [eMajor] = engineVersion.split('.').map(Number);
    const [sMajor] = CoreConstants.MIN_ENGINE_VERSION.split('.').map(Number);
    return eMajor >= sMajor;
  }
}
