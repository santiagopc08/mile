/**
 * Spatial Partitioning Grid for O(N) broadphase collision checks.
 */
export class SpatialGrid {
  /**
   * @param {number} cellSize - Size of each spatial cell in world units
   */
  constructor(cellSize = 4.0) {
    this.cellSize = cellSize;
    /** @type {Map<string, Set<number>>} cellKey -> Set<entityId> */
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  /**
   * Get grid cell coordinate string for a world point.
   * @param {number} x 
   * @param {number} y 
   * @returns {string}
   */
  _cellKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  /**
   * Insert entity into spatial cells covered by its bounding box.
   * @param {number} entityId 
   * @param {number} minX 
   * @param {number} minY 
   * @param {number} maxX 
   * @param {number} maxY 
   */
  insert(entityId, minX, minY, maxX, maxY) {
    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx}:${cy}`;
        let set = this.cells.get(key);
        if (!set) {
          set = new Set();
          this.cells.set(key, set);
        }
        set.add(entityId);
      }
    }
  }

  /**
   * Get candidate entity IDs in overlapping cells.
   * @param {number} minX 
   * @param {number} minY 
   * @param {number} maxX 
   * @param {number} maxY 
   * @returns {Set<number>}
   */
  getNearbyEntityIds(minX, minY, maxX, maxY) {
    const candidates = new Set();

    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx}:${cy}`;
        const set = this.cells.get(key);
        if (set) {
          set.forEach((id) => candidates.add(id));
        }
      }
    }

    return candidates;
  }
}
