export class ResourceBinding {
  constructor(logicalId, nativeResource) {
    this.logicalId = logicalId;
    this.nativeResource = nativeResource;
  }
}

export class MaterialBinding extends ResourceBinding {}
export class TextureBinding extends ResourceBinding {}
export class MeshBinding extends ResourceBinding {}
