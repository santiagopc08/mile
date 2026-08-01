export class MovementConstraint {
  apply(actor, movementComponent) {}
}

export class BoundsConstraint extends MovementConstraint {
  constructor(minX, minY, maxX, maxY) {
    super();
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  apply(actor, movementComponent) {
    const transform = actor.getComponent('TransformComponent');
    if (transform) {
      transform.x = Math.max(this.minX, Math.min(this.maxX, transform.x));
      transform.y = Math.max(this.minY, Math.min(this.maxY, transform.y));
    }
  }
}

export class AxisConstraint extends MovementConstraint {
  constructor(lockX = false, lockY = false) {
    super();
    this.lockX = lockX;
    this.lockY = lockY;
  }

  apply(actor, movementComponent) {
    if (movementComponent.velocity) {
      if (this.lockX) movementComponent.velocity.vx = 0;
      if (this.lockY) movementComponent.velocity.vy = 0;
    }
  }
}

export class SpeedConstraint extends MovementConstraint {
  constructor(minSpeed = 0, maxSpeed = 10.0) {
    super();
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
  }

  apply(actor, movementComponent) {
    if (movementComponent.velocity) {
      const speed = movementComponent.velocity.getSpeed();
      if (speed > this.maxSpeed && speed > 0) {
        const factor = this.maxSpeed / speed;
        movementComponent.velocity.vx *= factor;
        movementComponent.velocity.vy *= factor;
      }
    }
  }
}

export class RotationConstraint extends MovementConstraint {
  constructor(lockRotation = true) {
    super();
    this.lockRotation = lockRotation;
  }
}
