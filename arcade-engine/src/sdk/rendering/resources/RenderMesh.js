export class RenderMesh {
  constructor(id, geometry, material) {
    this.id = id;
    this.geometry = geometry;
    this.material = material;
  }
}

export class RenderTexture {
  constructor(urn = '') {
    this.urn = urn;
  }
}

export class RenderMaterial {
  constructor(name = 'default', texture = null) {
    this.name = name;
    this.texture = texture;
    this.tint = 0xffffff;
    this.opacity = 1.0;
  }
}

export class RenderSprite {
  constructor(textureUrn, frame = 0) {
    this.textureUrn = textureUrn;
    this.frame = frame;
  }
}

export class RenderGeometry {}
export class RenderFont {}
export class RenderShader {}
