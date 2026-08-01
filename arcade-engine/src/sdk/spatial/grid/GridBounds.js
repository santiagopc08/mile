export class GridBounds {
  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }

  isInside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
