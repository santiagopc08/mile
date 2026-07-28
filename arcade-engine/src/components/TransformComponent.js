import * as THREE from 'three';
import { Component } from '../engine/ecs/Component.js';

/**
 * Spatial Transform Component.
 */
export class TransformComponent extends Component {
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.position = new THREE.Vector3(x, y, z);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.scale = new THREE.Vector3(1, 1, 1);
  }
}
Component.register(TransformComponent);
