export class RegionCollection {
  constructor() {
    this.regions = new Map();
  }

  add(region) {
    this.regions.set(region.id, region);
  }

  get(id) {
    return this.regions.get(id) || null;
  }
}
