export class RenderCommand {
  constructor(type = 'UNKNOWN') {
    this.type = type;
  }
}

export class DrawCommand extends RenderCommand {
  constructor(mesh, material, transform, sortingOrder = 0) {
    super('DRAW');
    this.mesh = mesh;
    this.material = material;
    this.transform = transform;
    this.sortingOrder = sortingOrder;
  }
}

export class ClearCommand extends RenderCommand {
  constructor(color = 0x000000, clearDepth = true) {
    super('CLEAR');
    this.color = color;
    this.clearDepth = clearDepth;
  }
}

export class LayerCommand extends RenderCommand {
  constructor(layerName) {
    super('LAYER');
    this.layerName = layerName;
  }
}

export class ViewportCommand extends RenderCommand {
  constructor(viewport) {
    super('VIEWPORT');
    this.viewport = viewport;
  }
}
