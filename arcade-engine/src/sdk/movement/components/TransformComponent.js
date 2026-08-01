import { ActorComponent } from '../../actors/components/ActorComponent.js';
import { Transform2D } from '../../spatial/core/Transform2D.js';

export class TransformComponent extends ActorComponent {
  constructor(x = 0, y = 0, rotation = 0) {
    super('TransformComponent');
    this.transform = new Transform2D(x, y, rotation);
    this.dirty = true;
  }

  get x() { return this.transform.x; }
  set x(val) { this.transform.x = val; this.dirty = true; }

  get y() { return this.transform.y; }
  set y(val) { this.transform.y = val; this.dirty = true; }

  get rotation() { return this.transform.rotation; }
  set rotation(val) { this.transform.rotation = val; this.dirty = true; }

  setPosition(x, y) {
    this.transform.setPosition(x, y);
    this.dirty = true;
  }
}
