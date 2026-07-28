import { BasePlugin } from './BasePlugin.js';

/**
 * Arcade Plugin Loader.
 */
export class PluginLoader {
  /**
   * @param {import('../ArcadeEngine.js').ArcadeEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
    /** @type {BasePlugin|null} */
    this.activePlugin = null;
  }

  /**
   * Load and initialize an Arcade Game Plugin.
   * @param {BasePlugin} plugin 
   */
  async loadPlugin(plugin) {
    if (this.activePlugin) {
      this.unloadActivePlugin();
    }

    this.activePlugin = plugin;
    plugin.init(this.engine);

    // 1. Preload Assets
    await plugin.loadAssets(this.engine.assetManager);

    // 2. Register ECS Components & Systems
    plugin.registerComponents(this.engine.world);
    plugin.registerSystems(this.engine.world);

    // 3. Register Scenes
    plugin.registerScenes(this.engine.sceneManager);

    console.log(`[PluginLoader] Successfully loaded game plugin "${plugin.name}" (${plugin.id}).`);
  }

  unloadActivePlugin() {
    if (this.activePlugin) {
      this.activePlugin.unload();
      this.activePlugin = null;
    }
  }
}
