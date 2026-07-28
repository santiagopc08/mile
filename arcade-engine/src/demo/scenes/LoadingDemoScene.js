import { BaseScene } from '../../engine/scene/BaseScene.js';

export class LoadingDemoScene extends BaseScene {
  constructor() {
    super('LoadingDemo');
  }

  onEnter() {
    console.log('[LoadingDemoScene] Loading demo assets...');
    setTimeout(() => {
      if (this.engine) {
        this.engine.sceneManager.switchScene('TechnicalDemo');
      }
    }, 400);
  }
}
