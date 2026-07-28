/**
 * Base System for operating on Entity Components.
 */
export class System {
  constructor() {
    /** @type {import('./World.js').World|null} */
    this.world = null;
    this.enabled = true;
    this.priority = 0;
  }

  /**
   * Called when System is added to World.
   * @param {import('./World.js').World} world 
   */
  init(world) {
    this.world = world;
  }

  /**
   * Fixed update tick (physics & collisions).
   * @param {number} fixedDt 
   */
  fixedUpdate(fixedDt) {}

  /**
   * Variable update tick (AI, logic, input updates).
   * @param {number} dt 
   */
  update(dt) {}

  /**
   * Late update tick (camera, visual sync).
   * @param {number} dt 
   */
  lateUpdate(dt) {}

  /**
   * Render frame tick.
   * @param {number} alpha 
   */
  render(alpha) {}

  /**
   * Called when system is removed/destroyed.
   */
  destroy() {
    this.world = null;
  }
}
