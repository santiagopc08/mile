/**
 * Non-solid Trigger Volume helper.
 */
export class TriggerVolume {
  /**
   * @param {Object} options
   * @param {string} [options.tag='trigger']
   * @param {Function} [options.onEnter]
   * @param {Function} [options.onExit]
   */
  constructor({ tag = 'trigger', onEnter = null, onExit = null } = {}) {
    this.tag = tag;
    this.onEnter = onEnter;
    this.onExit = onExit;
    /** @type {Set<number>} Current entity IDs inside trigger */
    this.overlappingEntityIds = new Set();
  }
}
