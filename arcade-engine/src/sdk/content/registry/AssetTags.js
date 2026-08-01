export class AssetTags {
  constructor(tags = []) {
    this.tags = new Set(tags);
  }

  add(tag) {
    this.tags.add(tag);
  }

  remove(tag) {
    this.tags.delete(tag);
  }

  has(tag) {
    return this.tags.has(tag);
  }

  toArray() {
    return Array.from(this.tags);
  }
}
