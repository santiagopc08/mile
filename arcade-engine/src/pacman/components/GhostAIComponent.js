import { Component } from '../../engine/ecs/Component.js';
import { GhostType, GhostState, Direction } from '../PacmanConstants.js';

export class GhostAIComponent extends Component {
  constructor(type = GhostType.BLINKY, gx = 14, gy = 11) {
    super();
    this.type = type;
    this.state = GhostState.HOUSE;
    this.gridX = gx;
    this.gridY = gy;
    this.targetGridX = gx;
    this.targetGridY = gy;
    this.currentDirection = Direction.UP;
    this.targetTile = { x: gx, y: gy };
    this.progress = 0.0;
    this.frightenedTimer = 0.0;
    this.houseTimer = 0.0;
  }
}
Component.register(GhostAIComponent);
