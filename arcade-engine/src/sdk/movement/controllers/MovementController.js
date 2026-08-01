export class MovementController {
  update(actor, movementComponent, dt) {}
}

export class FreeMovementController extends MovementController {
  update(actor, movementComponent, dt) {
    const transform = actor.getComponent('TransformComponent');
    if (!transform) return;

    const vx = movementComponent.direction.dx * movementComponent.speed;
    const vy = movementComponent.direction.dy * movementComponent.speed;

    movementComponent.velocity.vx = vx;
    movementComponent.velocity.vy = vy;

    transform.x += vx * dt;
    transform.y += vy * dt;

    movementComponent.constraints.forEach((c) => c.apply(actor, movementComponent));
  }
}

export class GridMovementController extends MovementController {
  constructor(tileSize = 1) {
    super();
    this.tileSize = tileSize;
    this.moving = false;
    this.progress = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  move(actor, movementComponent, dx, dy) {
    if (this.moving) return false;
    const transform = actor.getComponent('TransformComponent');
    if (!transform) return false;

    this.startX = transform.x;
    this.startY = transform.y;
    this.targetX = transform.x + dx * this.tileSize;
    this.targetY = transform.y + dy * this.tileSize;
    this.moving = true;
    this.progress = 0;
    movementComponent.direction.dx = dx;
    movementComponent.direction.dy = dy;
    return true;
  }

  update(actor, movementComponent, dt) {
    if (!this.moving) return;
    const transform = actor.getComponent('TransformComponent');
    if (!transform) return;

    const distance = Math.sqrt(Math.pow(this.targetX - this.startX, 2) + Math.pow(this.targetY - this.startY, 2));
    if (distance === 0) {
      this.moving = false;
      return;
    }

    const step = (movementComponent.speed * dt) / distance;
    this.progress = Math.min(1.0, this.progress + step);

    const smoothT = this.progress * this.progress * (3 - 2 * this.progress); // Smoothstep
    transform.x = this.startX + (this.targetX - this.startX) * smoothT;
    transform.y = this.startY + (this.targetY - this.startY) * smoothT;

    if (this.progress >= 1.0) {
      transform.x = this.targetX;
      transform.y = this.targetY;
      this.moving = false;
    }
  }
}

export class WaypointMovementController extends MovementController {
  constructor(waypoints = []) {
    super();
    this.waypoints = waypoints;
    this.currentIndex = 0;
  }
}

export class PathMovementController extends MovementController {
  constructor(path = []) {
    super();
    this.path = path;
  }
}
