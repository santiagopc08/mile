/**
 * Cross-Platform Runtime Environment Inspector.
 */
export class Platform {
  static isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  static isNode() {
    return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
  }

  static isHeadless() {
    return !Platform.isBrowser();
  }

  static isElectron() {
    return Platform.isBrowser() && window.navigator.userAgent.indexOf('Electron') !== -1;
  }

  static isTauri() {
    return Platform.isBrowser() && window.__TAURI__ != null;
  }

  static isMobile() {
    if (!Platform.isBrowser()) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
