import { BehaviorAction } from '../actions/BehaviorAction.js';

export class BehaviorTask extends BehaviorAction {
  constructor(name = 'Task') {
    super(name);
  }
}

export class MovementTask extends BehaviorTask {
  constructor(dx, dy) {
    super('MovementTask');
    this.dx = dx;
    this.dy = dy;
  }

  execute(context) {
    if (context && context.actor) {
      const movement = context.actor.getComponent('MovementComponent');
      if (movement && movement.controller && typeof movement.controller.move === 'function') {
        movement.controller.move(context.actor, movement, this.dx, this.dy);
      }
    }
    this.completed = true;
  }
}

export class NavigationTask extends BehaviorTask {
  constructor(targetNode) {
    super('NavigationTask');
    this.targetNode = targetNode;
  }

  execute(context) {
    this.completed = true;
  }
}

export class PresentationTask extends BehaviorTask {
  constructor(animationName) {
    super('PresentationTask');
    this.animationName = animationName;
  }

  execute(context) {
    if (context && context.actor) {
      const anim = context.actor.getComponent('AnimationComponent');
      if (anim) anim.currentAnimation = this.animationName;
    }
    this.completed = true;
  }
}

export class InteractionTask extends BehaviorTask {
  execute(context) { this.completed = true; }
}

export class AudioTask extends BehaviorTask {
  execute(context) { this.completed = true; }
}

export class CameraTask extends BehaviorTask {
  execute(context) { this.completed = true; }
}
