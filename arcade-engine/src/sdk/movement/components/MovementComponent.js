import { ActorComponent } from '../../actors/components/ActorComponent.js';
import { MovementMode, MovementState } from '../movement/MovementMode.js';
import { VelocityComponent } from './VelocityComponent.js';
import { DirectionComponent } from './DirectionComponent.js';

export class MovementComponent extends ActorComponent {
  constructor(speed = 5.0, mode = MovementMode.GRID) {
    super('MovementComponent');
    this.speed = speed;
    this.maxSpeed = speed;
    this.mode = mode;
    this.state = MovementState.IDLE;
    this.velocity = new VelocityComponent();
    this.direction = new DirectionComponent();
    this.controller = null;
    this.constraints = [];
  }

  setController(controller) {
    this.controller = controller;
  }

  addConstraint(constraint) {
    this.constraints.push(constraint);
  }

  onUpdate(dt) {
    if (this.controller && this.enabled && this.state !== MovementState.PAUSED) {
      this.controller.update(this.owner, this, dt);
    }
  }
}
