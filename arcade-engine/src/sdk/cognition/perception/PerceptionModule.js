export class VisionService {
  constructor(fov = 90, range = 10) {
    this.fov = fov;
    this.range = range;
  }

  canSee(actor, targetPosition) { return true; }
}

export class HearingService {
  constructor(radius = 5) {
    this.radius = radius;
  }

  canHear(actor, noisePosition, volume = 1.0) { return true; }
}

export class ProximityService {
  constructor(radius = 1) {
    this.radius = radius;
  }

  isNear(actor, targetPosition) {
    const transform = actor ? actor.getComponent('TransformComponent') : null;
    if (!transform) return false;
    const dx = transform.x - targetPosition.x;
    const dy = transform.y - targetPosition.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
}

export class SensorFusion {
  static fuseObservations(observations = []) {
    return observations;
  }
}

export class PerceptionModule {
  constructor() {
    this.vision = new VisionService();
    this.hearing = new HearingService();
    this.proximity = new ProximityService();
  }
}
