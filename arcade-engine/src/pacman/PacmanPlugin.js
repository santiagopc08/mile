import { BasePlugin } from '../engine/plugin/BasePlugin.js';
import { PacmanScene } from './PacmanScene.js';
import { PacmanGridMovementSystem } from './systems/PacmanGridMovementSystem.js';
import { GhostAISystem } from './systems/GhostAISystem.js';
import { GhostStateSystem } from './systems/GhostStateSystem.js';
import { PacmanCollisionSystem } from './systems/PacmanCollisionSystem.js';
import { PacmanAnimationSystem } from './systems/PacmanAnimationSystem.js';
import { PacmanGameRulesSystem } from './systems/PacmanGameRulesSystem.js';
import { PacmanCameraSystem } from './systems/PacmanCameraSystem.js';
import mapData from './assets/maps/classic.json';

/**
 * Self-contained Pac-Man Game Plugin.
 */
export class PacmanPlugin extends BasePlugin {
  constructor() {
    super('pacman-plugin', 'PAC-MAN CLASSIC ARCADE');
  }

  async loadAssets(assetManager) {
    console.log('[PacmanPlugin] Loading classic map & procedural textures...');
    assetManager.createPlaceholderTexture('pacman', '#ffff00', 32);
    assetManager.createPlaceholderTexture('blinky', '#ff0000', 32);
    assetManager.createPlaceholderTexture('pinky', '#ffb8ff', 32);
    assetManager.createPlaceholderTexture('inky', '#00ffff', 32);
    assetManager.createPlaceholderTexture('clyde', '#ffb852', 32);
    assetManager.createPlaceholderTexture('frightened', '#0000ff', 32);
  }

  registerComponents(world) {
    // Components are registered upon module import
  }

  registerSystems(world) {
    const matrix = mapData.matrix;
    world.addSystem(new PacmanGridMovementSystem(matrix));
    world.addSystem(new GhostAISystem(matrix));
    world.addSystem(new GhostStateSystem());
    world.addSystem(new PacmanCollisionSystem());
    world.addSystem(new PacmanAnimationSystem());
    world.addSystem(new PacmanGameRulesSystem());
    world.addSystem(new PacmanCameraSystem());
  }

  registerScenes(sceneManager) {
    sceneManager.registerScene(new PacmanScene());
    sceneManager.switchScene('PacmanScene');
  }
}
