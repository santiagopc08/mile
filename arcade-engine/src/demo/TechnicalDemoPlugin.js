import { BasePlugin } from '../engine/plugin/BasePlugin.js';
import { LoadingDemoScene } from './scenes/LoadingDemoScene.js';
import { MainMenuDemoScene } from './scenes/MainMenuDemoScene.js';
import { TechnicalDemoScene } from './scenes/TechnicalDemoScene.js';
import { PauseDemoScene } from './scenes/PauseDemoScene.js';
import { PlayerControlSystem } from './systems/PlayerControlSystem.js';
import { InteractiveObjectSystem } from './systems/InteractiveObjectSystem.js';
import { CameraFollowSystem } from './systems/CameraFollowSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';

/**
 * Arcade Engine Technical Demo Plugin.
 * Demonstrates plugin lifecycle, asset loading, custom ECS systems, and scenes.
 */
export class TechnicalDemoPlugin extends BasePlugin {
  constructor() {
    super('technical-demo-plugin', 'ARCADE ENGINE TECHNICAL DEMO');
  }

  async loadAssets(assetManager) {
    console.log('[TechnicalDemoPlugin] Preloading test assets...');
    assetManager.createPlaceholderTexture('player', '#00ffaa', 32);
    assetManager.createPlaceholderTexture('crystal', '#00dbe9', 32);
    assetManager.createPlaceholderTexture('coin', '#ffd700', 32);
    assetManager.createPlaceholderTexture('portal', '#ff0055', 32);
  }

  registerComponents(world) {
    // Components are auto-registered upon import
  }

  registerSystems(world) {
    world.addSystem(new PlayerControlSystem());
    world.addSystem(new InteractiveObjectSystem());
    world.addSystem(new CameraFollowSystem());
    world.addSystem(new MovementSystem());
    world.addSystem(new CollisionSystem());
    world.addSystem(new RenderSystem());
  }

  registerScenes(sceneManager) {
    sceneManager.registerScene(new LoadingDemoScene());
    sceneManager.registerScene(new MainMenuDemoScene());
    sceneManager.registerScene(new TechnicalDemoScene());
    sceneManager.registerScene(new PauseDemoScene());

    // Initial Scene Transition
    sceneManager.switchScene('LoadingDemo');
  }
}
