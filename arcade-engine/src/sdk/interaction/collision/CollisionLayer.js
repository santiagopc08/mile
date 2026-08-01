export const CollisionLayer = Object.freeze({
  NONE: 0,
  GROUND: 1 << 0,
  WALLS: 1 << 1,
  CHARACTERS: 1 << 2,
  ITEMS: 1 << 3,
  PROJECTILES: 1 << 4,
  TRIGGERS: 1 << 5,
  ALL: 0xffffffff,
});

export class CollisionMask {
  constructor(mask = CollisionLayer.ALL) {
    this.mask = mask;
  }

  canCollide(otherLayer) {
    return (this.mask & otherLayer) !== 0;
  }
}

export class CollisionFilter {
  static filter(layerA, maskB) {
    return (layerA & maskB) !== 0;
  }
}
