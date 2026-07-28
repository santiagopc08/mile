import { ActionBinding } from './ActionBinding.js';

/**
 * Cross-device Input Manager supporting Keyboard, Gamepad, Mouse & Touch.
 */
export class InputManager {
  /**
   * @param {HTMLElement} [targetElement=window] 
   */
  constructor(targetElement = window) {
    this.targetElement = targetElement;

    /** @type {Map<string, ActionBinding>} */
    this.actions = new Map();

    /** @type {Set<string>} Active keyboard keys */
    this.activeKeys = new Set();
    /** @type {Set<number>} Active mouse buttons */
    this.activeMouseButtons = new Set();

    // Mouse & Touch position
    this.pointerPosition = { x: 0, y: 0 };
    this.pointerNormalized = { x: 0, y: 0 };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  unbindEvents() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchend', this._onTouchEnd);
  }

  /**
   * Define or update a virtual action binding.
   * @param {string} actionName 
   * @param {Object} bindings 
   */
  registerAction(actionName, bindings) {
    const action = new ActionBinding(actionName, bindings);
    this.actions.set(actionName, action);
    return action;
  }

  /**
   * Query if an action is currently held down.
   * @param {string} actionName 
   * @returns {boolean}
   */
  isActionActive(actionName) {
    const action = this.actions.get(actionName);
    return action ? action.isDown : false;
  }

  /**
   * Query if an action was pressed this tick.
   * @param {string} actionName 
   * @returns {boolean}
   */
  wasActionJustPressed(actionName) {
    const action = this.actions.get(actionName);
    return action ? action.justPressed : false;
  }

  /**
   * Query if an action was released this tick.
   * @param {string} actionName 
   * @returns {boolean}
   */
  wasActionJustReleased(actionName) {
    const action = this.actions.get(actionName);
    return action ? action.justReleased : false;
  }

  /**
   * Get 2D axis vector (e.g. for Movement).
   * @param {string} negativeXAction 
   * @param {string} positiveXAction 
   * @param {string} negativeYAction 
   * @param {string} positiveYAction 
   * @returns {{x: number, y: number}}
   */
  getAxisVector(negativeXAction, positiveXAction, negativeYAction, positiveYAction) {
    let x = 0;
    let y = 0;

    if (this.isActionActive(negativeXAction)) x -= 1;
    if (this.isActionActive(positiveXAction)) x += 1;
    if (this.isActionActive(negativeYAction)) y -= 1;
    if (this.isActionActive(positiveYAction)) y += 1;

    // Gamepad axis override if available
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        if (Math.abs(gp.axes[0]) > 0.2) x = gp.axes[0];
        if (Math.abs(gp.axes[1]) > 0.2) y = -gp.axes[1]; // Invert Y for arcade standard
      }
    }

    // Normalize
    const len = Math.sqrt(x * x + y * y);
    if (len > 1.0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  /**
   * Called once per frame update to resolve justPressed/justReleased state.
   */
  update() {
    // Poll Gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const activeGamepadButtons = new Set();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        for (let b = 0; b < gp.buttons.length; b++) {
          if (gp.buttons[b].pressed) {
            activeGamepadButtons.add(b);
          }
        }
      }
    }

    // Evaluate all Virtual Actions
    this.actions.forEach((action) => {
      let isPressed = false;

      // Check Keys (check code or key string)
      action.keys.forEach((key) => {
        if (this.activeKeys.has(key) || this.activeKeys.has(key.toLowerCase()) || this.activeKeys.has(key.toUpperCase())) {
          isPressed = true;
        }
      });

      // Check Mouse
      action.mouseButtons.forEach((btn) => {
        if (this.activeMouseButtons.has(btn)) isPressed = true;
      });

      // Check Gamepad
      action.gamepadButtons.forEach((btn) => {
        if (activeGamepadButtons.has(btn)) isPressed = true;
      });

      action.justPressed = !action.isDown && isPressed;
      action.justReleased = action.isDown && !isPressed;
      action.isDown = isPressed;
      action.value = isPressed ? 1.0 : 0.0;
    });
  }

  _onKeyDown(e) {
    // Prevent default browser shortcuts for game control keys
    if (['F1', 'F2', 'F3', 'F4', 'F5', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) ||
        ['F1', 'F2', 'F3', 'F4', 'F5'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    this.activeKeys.add(e.code);
    if (e.key) this.activeKeys.add(e.key);
  }

  _onKeyUp(e) {
    this.activeKeys.delete(e.code);
    if (e.key) this.activeKeys.delete(e.key);
  }

  _onMouseDown(e) {
    this.activeMouseButtons.add(e.button);
  }

  _onMouseUp(e) {
    this.activeMouseButtons.delete(e.button);
  }

  _onMouseMove(e) {
    this.pointerPosition.x = e.clientX;
    this.pointerPosition.y = e.clientY;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.pointerNormalized.x = (e.clientX / w) * 2 - 1;
    this.pointerNormalized.y = -(e.clientY / h) * 2 + 1;
  }

  _onTouchStart(e) {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      this.pointerPosition.x = t.clientX;
      this.pointerPosition.y = t.clientY;
    }
  }

  _onTouchEnd(e) {
    // Touch end cleanup
  }

  destroy() {
    this.unbindEvents();
    this.actions.clear();
    this.activeKeys.clear();
    this.activeMouseButtons.clear();
  }
}
