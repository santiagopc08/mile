export class RegionIndex {
  constructor() {
    this.regions = new Map();
  }

  insert(region) {
    this.regions.set(region.id, region);
  }
}
