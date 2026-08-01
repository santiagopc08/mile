import { ActorComponent } from '../../actors/components/ActorComponent.js';

export class PresentationComponent extends ActorComponent {
  constructor() {
    super('PresentationComponent');
    this.visible = true;
    this.opacity = 1.0;
    this.layer = 'default';
    this.sortingOrder = 0;
  }
}

export class SpriteComponent extends ActorComponent {
  constructor(textureUrn = '') {
    super('SpriteComponent');
    this.textureUrn = textureUrn;
    this.frame = 0;
    this.flipX = false;
    this.flipY = false;
    this.tint = 0xffffff;
  }
}

export class VisualStateComponent extends ActorComponent {
  constructor(stateName = 'DEFAULT') {
    super('VisualStateComponent');
    this.stateName = stateName;
  }
}
