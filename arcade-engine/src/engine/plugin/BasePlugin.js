/**
 * Base Arcade Game Plugin Interface.
 * Implement this interface to build Arcade Games (Pac-Man, Snake, Tetris, Breakout, etc.)
 */
export class BasePlugin {
  /**
   * @param {string} id - Unique Game Identifier
   * @param {string} name - Human Readable Game Title
   */
  constructor(id, name) {
    this.id = id;
    this.name = name;
    /** @type {import('../ArcadeEngine.js').ArcadeEngine|null} */
    this.engine = null;
  }

  init(engine) {
    this.engine = engine;
  }

  /**
   * Preload Game Assets (textures, audio, configs).
   * @param {import('../assets/AssetManager.js').AssetManager} assetManager 
   */
  async loadAssets(assetManager) {}

  /**
   * Register Game-specific Components into World.
   * @param {import('../ecs/World.js').World} world 
   */
  registerComponents(world) {}

  /**
   * Register Game-specific Systems into World.
   * @param {import('../ecs/World.js').World} world 
   */
  registerSystems(world) {}

  /**
   * Register Game Scenes into SceneManager.
   * @param {import('../scene/SceneManager.js').SceneManager} sceneManager 
   */
  registerScenes(sceneManager) {}

  /**
   * Called when plugin is unloaded.
   */
  unload() {
    this.engine = null;
  }
}
