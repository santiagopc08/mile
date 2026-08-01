import { ActorComponent } from '../../actors/components/ActorComponent.js';

export class VelocityComponent extends ActorComponent {
  constructor(vx = 0, vy = 0) {
    super('VelocityComponent');
    this.vx = vx;
    this.vy = vy;
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
}

export class RotationComponent extends ActorComponent {
  constructor(angle = 0, angularSpeed = 0) {
    super('RotationComponent');
    this.angle = angle;
    this.angularSpeed = angularSpeed;
  }
}

export class DirectionComponent extends ActorComponent {
  constructor(dx = 0, dy = 0) {
    super('DirectionComponent');
    this.dx = dx;
    this.dy = dy;
  }

  setCardinal(directionName) {
    switch (directionName) {
      case 'UP': this.dx = 0; this.dy = -1; break;
      case 'DOWN': this.dx = 0; this.dy = 1; break;
      case 'LEFT': this.dx = -1; this.dy = 0; break;
      case 'RIGHT': this.dx = 1; this.dy = 0; break;
      default: this.dx = 0; this.dy = 0; break;
    }
  }
}

export class AccelerationComponent extends ActorComponent {
  constructor(ax = 0, ay = 0) {
    super('AccelerationComponent');
    this.ax = ax;
    this.ay = ay;
  }
}
