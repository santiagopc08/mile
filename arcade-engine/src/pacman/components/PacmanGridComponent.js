import { Component } from '../../engine/ecs/Component.js';
import { Direction } from '../PacmanConstants.js';

export class PacmanGridComponent extends Component {
  constructor(gx = 14, gy = 23) {
    super();
    this.gridX = gx;
    this.gridY = gy;
    this.targetGridX = gx;
    this.targetGridY = gy;
    this.currentDirection = Direction.NONE;
    this.bufferedDirection = Direction.NONE;
    this.progress = 0.0;
    this.mouthAngle = 0.0;
    this.mouthOpening = true;
  }
}
Component.register(PacmanGridComponent);
