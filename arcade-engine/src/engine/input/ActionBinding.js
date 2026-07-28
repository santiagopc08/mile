/**
 * Rebindable Input Action Bindings.
 */
export class ActionBinding {
  /**
   * @param {string} name - Virtual Action Name (e.g. 'MOVE_LEFT', 'FIRE')
   * @param {Object} [bindings]
   * @param {string[]} [bindings.keys] - Keyboard keys (e.g. ['ArrowLeft', 'KeyA'])
   * @param {number[]} [bindings.gamepadButtons] - Gamepad button indices (e.g. [14, 0])
   * @param {number[]} [bindings.mouseButtons] - Mouse button indices (e.g. [0])
   */
  constructor(name, { keys = [], gamepadButtons = [], mouseButtons = [] } = {}) {
    this.name = name;
    this.keys = new Set(keys);
    this.gamepadButtons = new Set(gamepadButtons);
    this.mouseButtons = new Set(mouseButtons);

    this.isDown = false;
    this.justPressed = false;
    this.justReleased = false;
    this.value = 0.0;
  }
}
