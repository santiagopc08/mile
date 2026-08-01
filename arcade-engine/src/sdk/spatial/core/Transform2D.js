export class Transform2D {
  constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
}
