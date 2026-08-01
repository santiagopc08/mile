import { ActorComponent } from '../../actors/components/ActorComponent.js';

export class AnimationComponent extends ActorComponent {
  constructor(initialAnimation = 'idle') {
    super('AnimationComponent');
    this.currentAnimation = initialAnimation;
    this.playbackSpeed = 1.0;
    this.loop = true;
    this.playing = true;
    this.elapsedTime = 0;
  }
}
