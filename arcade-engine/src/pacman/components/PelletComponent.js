import { Component } from '../../engine/ecs/Component.js';
import { PelletType } from '../PacmanConstants.js';

export class PelletComponent extends Component {
  constructor(type = PelletType.DOT, points = 10, gx = 0, gy = 0) {
    super();
    this.type = type;
    this.points = points;
    this.gridX = gx;
    this.gridY = gy;
  }
}
Component.register(PelletComponent);
