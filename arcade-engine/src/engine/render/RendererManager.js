import * as THREE from 'three';

/**
 * High-performance WebGL Renderer Manager for 2D/2.5D Arcade Visuals.
 */
export class RendererManager {
  /**
   * @param {Object} options
   * @param {HTMLElement} [options.container]
   * @param {boolean} [options.antialias=true]
   * @param {boolean} [options.shadows=true]
   */
  constructor({ container = document.body, antialias = true, shadows = true } = {}) {
    this.container = container;

    // Three.js Scene & Renderer initialization
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0814); // Sleek Arcade Dark Background

    this.renderer = new THREE.WebGLRenderer({
      antialias,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.domElement = this.renderer.domElement;
    this.domElement.style.cssText = 'display: block; width: 100%; height: 100%;';
    this.container.appendChild(this.domElement);

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    /** @type {Function[]} Custom resize callbacks */
    this.resizeCallbacks = [];
  }

  onResize(callback) {
    this.resizeCallbacks.push(callback);
  }

  _onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    for (let i = 0; i < this.resizeCallbacks.length; i++) {
      this.resizeCallbacks[i](width, height);
    }
  }

  /**
   * Render Scene with current Camera.
   * @param {THREE.Camera} camera 
   */
  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.resizeCallbacks = [];

    if (this.domElement && this.domElement.parentElement) {
      this.domElement.parentElement.removeChild(this.domElement);
    }

    this.renderer.dispose();
  }
}
