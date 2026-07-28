import * as THREE from 'three';

/**
 * Camera Manager supporting 2D/2.5D Orthographic and Perspective Arcade Views.
 */
export class CameraManager {
  /**
   * @param {Object} options
   * @param {'perspective'|'orthographic'} [options.mode='orthographic']
   * @param {number} [options.viewportWidth=20]
   * @param {number} [options.aspect=16/9]
   */
  constructor({ mode = 'orthographic', viewportWidth = 20, aspect = 16 / 9 } = {}) {
    this.mode = mode;
    this.viewportWidth = viewportWidth;
    this.aspect = aspect;

    // Shake Parameters
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = new THREE.Vector3();

    this.basePosition = new THREE.Vector3(0, 0, 10);
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    if (mode === 'orthographic') {
      const halfW = viewportWidth / 2;
      const halfH = halfW / aspect;
      this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 1000);
    } else {
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    }

    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.targetPosition);
  }

  /**
   * Handle viewport resize.
   * @param {number} width 
   * @param {number} height 
   */
  handleResize(width, height) {
    this.aspect = width / height;

    if (this.mode === 'orthographic') {
      const halfW = this.viewportWidth / 2;
      const halfH = halfW / this.aspect;
      this.camera.left = -halfW;
      this.camera.right = halfW;
      this.camera.top = halfH;
      this.camera.bottom = -halfH;
    } else {
      this.camera.aspect = this.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  /**
   * Trigger screen shake.
   * @param {number} intensity 
   * @param {number} durationSec 
   */
  shake(intensity = 0.5, durationSec = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationSec;
    this.shakeTimer = durationSec;
  }

  /**
   * Set target follow position.
   * @param {number} x 
   * @param {number} y 
   * @param {number} [z] 
   */
  setTarget(x, y, z = 0) {
    this.targetPosition.set(x, y, z);
  }

  /**
   * Update camera position & apply shake.
   * @param {number} dt 
   */
  update(dt) {
    // Smooth camera follow
    this.basePosition.x += (this.targetPosition.x - this.basePosition.x) * 5.0 * dt;
    this.basePosition.y += (this.targetPosition.y - this.basePosition.y) * 5.0 * dt;

    // Apply Shake
    this.shakeOffset.set(0, 0, 0);
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const factor = this.shakeTimer / this.shakeDuration;
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity * factor,
        (Math.random() - 0.5) * 2 * this.shakeIntensity * factor,
        0
      );
    }

    this.camera.position.x = this.basePosition.x + this.shakeOffset.x;
    this.camera.position.y = this.basePosition.y + this.shakeOffset.y;
    this.camera.position.z = this.basePosition.z + this.shakeOffset.z;

    this.camera.lookAt(this.targetPosition.x, this.targetPosition.y, 0);
  }
}
