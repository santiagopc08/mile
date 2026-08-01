import { ActorComponent } from '../../actors/components/ActorComponent.js';

export const Direction = Object.freeze({
  NONE: 'NONE',
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
});

export class DirectionComponent extends ActorComponent {
  constructor() {
    super('DirectionComponent');
    this.current = Direction.NONE;
    this.previous = Direction.NONE;
    this.angle = 0;
  }

  set(direction) {
    this.previous = this.current;
    this.current = direction;
  }

  setAngle(angle) {
    this.angle = angle;
  }
}
