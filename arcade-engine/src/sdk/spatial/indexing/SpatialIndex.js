export class SpatialIndex {
  constructor() {
    this.entityToCoords = new Map(); // entityId -> { x, y }
    this.coordsToEntities = new Map(); // "x,y" -> Set<entityId>
  }

  insert(entityId, x, y) {
    this.remove(entityId);
    this.entityToCoords.set(entityId, { x, y });
    const key = `${x},${y}`;
    if (!this.coordsToEntities.has(key)) {
      this.coordsToEntities.set(key, new Set());
    }
    this.coordsToEntities.get(key).add(entityId);
  }

  remove(entityId) {
    if (this.entityToCoords.has(entityId)) {
      const { x, y } = this.entityToCoords.get(entityId);
      const key = `${x},${y}`;
      if (this.coordsToEntities.has(key)) {
        this.coordsToEntities.get(key).delete(entityId);
      }
      this.entityToCoords.delete(entityId);
    }
  }

  getAt(x, y) {
    const key = `${x},${y}`;
    return this.coordsToEntities.get(key) || new Set();
  }
}
