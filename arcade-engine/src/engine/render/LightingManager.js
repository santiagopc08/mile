import * as THREE from 'three';

/**
 * Lighting Manager for 2D/2.5D Arcade Visuals.
 */
export class LightingManager {
  /**
   * @param {THREE.Scene} scene 
   */
  constructor(scene) {
    this.scene = scene;

    // 1. Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);

    // 2. Main Directional Light (Sun / Arcade Key Light)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.directionalLight.position.set(10, 15, 20);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;

    const d = 15;
    this.directionalLight.shadow.camera.left = -d;
    this.directionalLight.shadow.camera.right = d;
    this.directionalLight.shadow.camera.top = d;
    this.directionalLight.shadow.camera.bottom = -d;

    this.scene.add(this.directionalLight);

    // 3. Arcade Rim Light (Neon Glow Accent)
    this.rimLight = new THREE.DirectionalLight(0x00ffcc, 0.6);
    this.rimLight.position.set(-10, -10, -5);
    this.scene.add(this.rimLight);
  }

  setAmbientColor(colorHex, intensity = 0.8) {
    this.ambientLight.color.setHex(colorHex);
    this.ambientLight.intensity = intensity;
  }

  setKeyLight(colorHex, intensity = 1.2) {
    this.directionalLight.color.setHex(colorHex);
    this.directionalLight.intensity = intensity;
  }

  setRimLight(colorHex, intensity = 0.6) {
    this.rimLight.color.setHex(colorHex);
    this.rimLight.intensity = intensity;
  }
}
