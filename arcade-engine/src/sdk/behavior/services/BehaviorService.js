export class MovementService {
  move(actor, dx, dy) {}
}

export class NavigationService {
  solvePath(startNode, goalNode) {}
}

export class PresentationService {
  playAnimation(actor, animName) {}
}

export class InteractionService {
  checkCollision(actor, x, y) {}
}

export class BehaviorService {
  constructor() {
    this.movement = new MovementService();
    this.navigation = new NavigationService();
    this.presentation = new PresentationService();
    this.interaction = new InteractionService();
  }
}
