import { Platform } from '../utils/Platform.js';

export const EnvironmentType = Object.freeze({
  DEVELOPMENT: 'DEVELOPMENT',
  PRODUCTION: 'PRODUCTION',
  TESTING: 'TESTING',
});

export class Environment {
  constructor(type = EnvironmentType.DEVELOPMENT) {
    this.type = type;
  }

  isDev() {
    return this.type === EnvironmentType.DEVELOPMENT;
  }

  isProd() {
    return this.type === EnvironmentType.PRODUCTION;
  }

  isTesting() {
    return this.type === EnvironmentType.TESTING;
  }

  getPlatformInfo() {
    return {
      isBrowser: Platform.isBrowser(),
      isNode: Platform.isNode(),
      isHeadless: Platform.isHeadless(),
      isElectron: Platform.isElectron(),
      isTauri: Platform.isTauri(),
      isMobile: Platform.isMobile(),
    };
  }
}
