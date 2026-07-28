import * as THREE from 'three';
import { Component } from '../engine/ecs/Component.js';

/**
 * Kinematic Velocity Component.
 */
export class VelocityComponent extends Component {
  constructor(vx = 0, vy = 0, maxSpeed = 10) {
    super();
    this.velocity = new THREE.Vector2(vx, vy);
    this.maxSpeed = maxSpeed;
    this.drag = 0.0;
  }
}
Component.register(VelocityComponent);
