/**
 * Base Scene Interface for Arcade Engine Scenes.
 */
export class BaseScene {
  /**
   * @param {string} name - Unique Scene Identifier
   */
  constructor(name) {
    this.name = name;
    /** @type {import('../ArcadeEngine.js').ArcadeEngine|null} */
    this.engine = null;
  }

  /**
   * Called when scene is added to SceneManager.
   * @param {import('../ArcadeEngine.js').ArcadeEngine} engine 
   */
  init(engine) {
    this.engine = engine;
  }

  /**
   * Called when entering the scene.
   * @param {any} [data] Payload passed from previous scene
   */
  onEnter(data) {}

  /**
   * Fixed physics tick for scene.
   * @param {number} fixedDt 
   */
  onFixedUpdate(fixedDt) {}

  /**
   * Variable update tick for scene.
   * @param {number} dt 
   */
  onUpdate(dt) {}

  /**
   * Called when exiting the scene.
   */
  onExit() {}

  /**
   * Called when scene is removed/destroyed.
   */
  onDestroy() {
    this.engine = null;
  }
}
