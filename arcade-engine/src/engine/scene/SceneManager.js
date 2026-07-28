import { BaseScene } from './BaseScene.js';
import { SceneTransition } from './Transitions.js';

/**
 * Scene State Machine Manager.
 */
export class SceneManager {
  /**
   * @param {import('../ArcadeEngine.js').ArcadeEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
    /** @type {Map<string, BaseScene>} */
    this.scenes = new Map();
    /** @type {BaseScene|null} Active Scene */
    this.activeScene = null;
    this.transition = new SceneTransition(0.3);
  }

  /**
   * Register a scene.
   * @param {BaseScene} scene 
   */
  registerScene(scene) {
    scene.init(this.engine);
    this.scenes.set(scene.name, scene);
  }

  /**
   * Switch active scene.
   * @param {string} sceneName 
   * @param {any} [data] Payload for new scene
   */
  switchScene(sceneName, data = null) {
    const targetScene = this.scenes.get(sceneName);
    if (!targetScene) {
      console.error(`[SceneManager] Scene "${sceneName}" not registered.`);
      return;
    }

    if (this.activeScene) {
      this.activeScene.onExit();
    }

    this.transition.start(() => {
      this.activeScene = targetScene;
      this.activeScene.onEnter(data);
    });
  }

  fixedUpdate(fixedDt) {
    if (this.activeScene) {
      this.activeScene.onFixedUpdate(fixedDt);
    }
  }

  update(dt) {
    this.transition.update(dt);
    if (this.activeScene) {
      this.activeScene.onUpdate(dt);
    }
  }

  destroy() {
    if (this.activeScene) {
      this.activeScene.onExit();
      this.activeScene = null;
    }
    this.scenes.forEach((scene) => scene.onDestroy());
    this.scenes.clear();
  }
}
