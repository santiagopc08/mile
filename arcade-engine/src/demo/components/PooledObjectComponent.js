import { Component } from '../../engine/ecs/Component.js';

export class PooledObjectComponent extends Component {
  constructor(lifespanSec = 5.0) {
    super();
    this.lifespan = lifespanSec;
    this.age = 0;
  }
}
Component.register(PooledObjectComponent);
