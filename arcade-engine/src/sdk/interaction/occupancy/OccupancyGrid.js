export const OccupancyState = Object.freeze({
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  BLOCKED: 'BLOCKED',
});

export class OccupancyGrid {
  constructor(width = 28, height = 36) {
    this.width = width;
    this.height = height;
    this.matrix = new Array(width * height).fill(OccupancyState.FREE);
  }

  set(x, y, state) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.matrix[y * this.width + x] = state;
    }
  }

  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return OccupancyState.BLOCKED;
    return this.matrix[y * this.width + x];
  }
}

export class OccupancyManager {
  constructor(width, height) {
    this.grid = new OccupancyGrid(width, height);
  }
}
