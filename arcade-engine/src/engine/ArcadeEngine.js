import { EventBus, EngineEvents } from './core/EventBus.js';
import { GameLoop } from './core/GameLoop.js';
import { World } from './ecs/World.js';
import { RendererManager } from './render/RendererManager.js';
import { CameraManager } from './render/CameraManager.js';
import { LightingManager } from './render/LightingManager.js';
import { InputManager } from './input/InputManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { AssetManager } from './assets/AssetManager.js';
import { AnimationSystem } from './animation/AnimationSystem.js';
import { SceneManager } from './scene/SceneManager.js';
import { PluginLoader } from './plugin/PluginLoader.js';
import { UIBridge } from './ui/UIBridge.js';
import { DebugOverlay } from './utils/DebugOverlay.js';

/**
 * Main Arcade Engine Facade.
 */
export class ArcadeEngine {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.container] - Canvas parent container element
   * @param {'orthographic'|'perspective'} [options.cameraMode='orthographic']
   * @param {boolean} [options.debug=false]
   */
  constructor({ container = document.body, cameraMode = 'orthographic', debug = false } = {}) {
    this.container = container;
    this.debugMode = debug;

    // 1. Core Subsystems
    this.eventBus = new EventBus();
    this.world = new World();
    this.uiBridge = new UIBridge(this.eventBus);

    // 2. Rendering & Scene Systems
    this.rendererManager = new RendererManager({ container: this.container });
    this.cameraManager = new CameraManager({ mode: cameraMode });
    this.lightingManager = new LightingManager(this.rendererManager.scene);

    this.rendererManager.onResize((w, h) => {
      this.cameraManager.handleResize(w, h);
    });

    // 3. Audio, Assets & Animation
    this.assetManager = new AssetManager();
    this.audioManager = new AudioManager();
    this.animationSystem = new AnimationSystem();
    this.world.addSystem(this.animationSystem);

    // 4. Input & Scene Control
    this.inputManager = new InputManager(this.container);
    this.sceneManager = new SceneManager(this);
    this.pluginLoader = new PluginLoader(this);

    // 5. Debug Overlay
    this.debugOverlay = new DebugOverlay();
    if (this.container) this.debugOverlay.mount(this.container);
    if (debug) this.debugOverlay.show();

    // 6. Deterministic Game Loop
    this.loop = new GameLoop({
      targetFps: 60,
      onAlwaysUpdate: (dt) => this.inputManager.update(),
      onFixedUpdate: (fixedDt) => this._fixedUpdate(fixedDt),
      onUpdate: (dt) => this._update(dt),
      onLateUpdate: (dt) => this._lateUpdate(dt),
      onRender: (alpha) => this._render(alpha),
    });
  }

  /**
   * Load an Arcade Game Plugin.
   * @param {import('./plugin/BasePlugin.js').BasePlugin} plugin 
   */
  async loadGame(plugin) {
    await this.pluginLoader.loadPlugin(plugin);
    this.eventBus.emit(EngineEvents.GAME_LOADED, { id: plugin.id, name: plugin.name });
  }

  /**
   * Start the Engine and Game Loop.
   */
  start() {
    this.loop.start();
    this.eventBus.emit(EngineEvents.GAME_STARTED);
  }

  /**
   * Pause simulation update ticks.
   */
  pause() {
    this.loop.pause();
    this.eventBus.emit(EngineEvents.GAME_PAUSED);
  }

  /**
   * Resume simulation update ticks.
   */
  resume() {
    this.loop.resume();
    this.eventBus.emit(EngineEvents.GAME_RESUMED);
  }

  _fixedUpdate(fixedDt) {
    this.world.fixedUpdate(fixedDt);
    this.sceneManager.fixedUpdate(fixedDt);
  }

  _update(dt) {
    this.world.update(dt);
    this.sceneManager.update(dt);
    this.cameraManager.update(dt);

    // Update telemetry
    this.eventBus.emit(EngineEvents.FPS_UPDATED, this.loop.fps);
    this.debugOverlay.update({
      fps: this.loop.fps,
      entityCount: this.world.entities.size,
      systemCount: this.world.systems.length,
    });
  }

  _lateUpdate(dt) {
    this.world.lateUpdate(dt);
  }

  _render(alpha) {
    this.world.render(alpha);
    this.rendererManager.render(this.cameraManager.camera);
  }

  /**
   * Destroy Engine instance and clean up WebGL / audio / event contexts.
   */
  destroy() {
    this.loop.stop();
    this.pluginLoader.unloadActivePlugin();
    this.sceneManager.destroy();
    this.world.clear();
    this.rendererManager.destroy();
    this.inputManager.destroy();
    this.audioManager.destroy();
    this.assetManager.clear();
    this.eventBus.clear();
    this.debugOverlay.destroy();
  }
}
