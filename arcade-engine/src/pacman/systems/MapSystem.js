import * as THREE from 'three';
import { System } from '../../engine/ecs/System.js';
import { PacmanConfig } from '../PacmanConfig.js';

export class MapSystem extends System {
  constructor() {
    super();
    this.initialized = false;
  }

  init(world) {
    super.init(world);
    if (!this.world || !this.world.engine) return;

    const scene = this.world.engine.rendererManager.scene;

    // Laboratory Grid Lines Overlay
    const gridHelper = new THREE.GridHelper(36, 36, 0x2121ff, 0x0a0a24);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0.01;
    scene.add(gridHelper);

    // Map Outer Border Lines
    const borderGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(PacmanConfig.ORIGIN_X, PacmanConfig.ORIGIN_Y, 0.02),
      new THREE.Vector3(PacmanConfig.ORIGIN_X + 28, PacmanConfig.ORIGIN_Y, 0.02),
      new THREE.Vector3(PacmanConfig.ORIGIN_X + 28, PacmanConfig.ORIGIN_Y - 31, 0.02),
      new THREE.Vector3(PacmanConfig.ORIGIN_X, PacmanConfig.ORIGIN_Y - 31, 0.02),
      new THREE.Vector3(PacmanConfig.ORIGIN_X, PacmanConfig.ORIGIN_Y, 0.02),
    ]);
    const borderMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    scene.add(borderLine);
  }
}
