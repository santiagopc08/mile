export class OverlapResult {
  constructor(hasOverlap, entityA = null, entityB = null) {
    this.hasOverlap = hasOverlap;
    this.entityA = entityA;
    this.entityB = entityB;
  }
}

export class OverlapFilter {
  static filter(entityA, entityB) { return true; }
}

export class OverlapManager {
  static checkOverlap(shapeA, shapeB) {
    const intersects = shapeA.bounds.intersects(shapeB.bounds);
    return new OverlapResult(intersects, shapeA, shapeB);
  }
}
