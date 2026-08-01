import { Platform } from './Platform.js';

export class Capabilities {
  static hasWebGL() {
    if (!Platform.isBrowser()) return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  static hasWebGL2() {
    if (!Platform.isBrowser()) return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  static hasWebAudio() {
    if (!Platform.isBrowser()) return false;
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  static hasTouch() {
    if (!Platform.isBrowser()) return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
