import { Component } from '../engine/ecs/Component.js';

/**
 * Renderable 2D/2.5D Mesh Sprite Component.
 */
export class SpriteComponent extends Component {
  /**
   * @param {Object} options
   * @param {import('three').Mesh} [options.mesh]
   * @param {string} [options.colorHex='#ffffff']
   * @param {number} [options.width=1]
   * @param {number} [options.height=1]
   */
  constructor({ mesh = null, colorHex = '#ffffff', width = 1, height = 1 } = {}) {
    super();
    this.mesh = mesh;
    this.colorHex = colorHex;
    this.width = width;
    this.height = height;
    this.visible = true;
  }
}
Component.register(SpriteComponent);
