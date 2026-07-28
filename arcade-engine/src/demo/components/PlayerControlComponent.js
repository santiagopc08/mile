import { Component } from '../../engine/ecs/Component.js';

export class PlayerControlComponent extends Component {
  constructor({ speed = 14, acceleration = 45, friction = 10, sprintMultiplier = 1.6 } = {}) {
    super();
    this.speed = speed;
    this.acceleration = acceleration;
    this.friction = friction;
    this.sprintMultiplier = sprintMultiplier;
  }
}
Component.register(PlayerControlComponent);
