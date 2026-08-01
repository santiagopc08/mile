export class GridMask {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.mask = new Uint8Array(width * height);
  }

  set(x, y, value) {
    this.mask[y * this.width + x] = value ? 1 : 0;
  }

  get(x, y) {
    return this.mask[y * this.width + x] === 1;
  }
}
