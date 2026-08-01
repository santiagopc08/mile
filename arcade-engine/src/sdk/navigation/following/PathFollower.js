export class Waypoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class PathCursor {
  constructor(path = []) {
    this.path = path;
    this.currentIndex = 0;
  }

  getCurrent() { return this.path[this.currentIndex] || null; }
  getNext() { return this.path[this.currentIndex + 1] || null; }
  advance() { if (this.currentIndex < this.path.length - 1) this.currentIndex++; }
  isComplete() { return this.currentIndex >= this.path.length - 1; }
}

export class PathInterpolator {
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }
}

export class PathFollower {
  constructor(path = []) {
    this.cursor = new PathCursor(path);
    this.progress = 0;
    this.active = path.length > 0;
  }

  update(progressDelta) {
    if (!this.active) return;
    this.progress += progressDelta;
    if (this.progress >= 1.0) {
      this.progress = 0;
      this.cursor.advance();
      if (this.cursor.isComplete()) {
        this.active = false;
      }
    }
  }
}
