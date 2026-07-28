import { Component } from '../../engine/ecs/Component.js';

export class FruitComponent extends Component {
  constructor(points = 1000, lifespanSec = 10.0) {
    super();
    this.points = points;
    this.lifespan = lifespanSec;
    this.timer = 0.0;
  }
}
Component.register(FruitComponent);
