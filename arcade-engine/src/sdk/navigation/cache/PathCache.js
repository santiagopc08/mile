export class RouteCache {
  constructor() {
    this.routes = new Map();
  }

  get(startId, goalId) {
    return this.routes.get(`${startId}->${goalId}`) || null;
  }

  set(startId, goalId, path) {
    this.routes.set(`${startId}->${goalId}`, path);
  }

  clear() {
    this.routes.clear();
  }
}

export class PathCache extends RouteCache {}
