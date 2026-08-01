export class RendererAdapter {
  initialize() {}
  shutdown() {}
  submitCommands(renderQueue) {}
  presentFrame() {}
}

export class HeadlessRendererAdapter extends RendererAdapter {
  constructor() {
    super();
    this.submittedQueue = null;
    this.totalFramesPresented = 0;
  }

  submitCommands(renderQueue) {
    this.submittedQueue = renderQueue;
  }

  presentFrame() {
    this.totalFramesPresented++;
  }
}

export class ThreeRendererAdapter extends RendererAdapter {}
export class PixiRendererAdapter extends RendererAdapter {}
export class CanvasRendererAdapter extends RendererAdapter {}
