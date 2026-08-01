export class MapProperties {
  constructor(props = {}) {
    this.props = new Map(Object.entries(props));
  }
}

export class MapTags {
  constructor(tags = []) {
    this.tags = new Set(tags);
  }
}

export class MapMetadata {
  constructor(options = {}) {
    this.name = options.name || 'unnamed_map';
    this.author = options.author || 'unknown';
    this.version = options.version || '1.0.0';
    this.properties = new MapProperties(options.properties);
    this.tags = new MapTags(options.tags);
  }
}
