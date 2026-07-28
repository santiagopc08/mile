import { BaseScene } from '../../engine/scene/BaseScene.js';

export class MainMenuDemoScene extends BaseScene {
  constructor() {
    super('MainMenuDemo');
  }

  onEnter() {
    console.log('[MainMenuDemoScene] Main Menu Scene Active.');
  }
}
