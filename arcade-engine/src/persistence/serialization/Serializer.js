export class SerializationContext {
  constructor(version = '1.0.0') {
    this.version = version;
  }
}

export class SchemaRegistry {
  constructor() {
    this.schemas = new Map();
  }
}

export class Serializer {
  static serialize(data) {
    return JSON.stringify(data, null, 2);
  }
}

export class Deserializer {
  static deserialize(jsonString) {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  }
}
