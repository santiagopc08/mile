import { Component } from '../engine/ecs/Component.js';

export const CollisionLayer = Object.freeze({
  DEFAULT: 1 << 0,
  PLAYER: 1 << 1,
  ENEMY: 1 << 2,
  PLAYER_BULLET: 1 << 3,
  ENEMY_BULLET: 1 << 4,
  POWERUP: 1 << 5,
  WALL: 1 << 6,
});

/**
 * Collider Bounds Component.
 */
export class ColliderComponent extends Component {
  /**
   * @param {Object} options
   * @param {'aabb'|'circle'} [options.type='aabb']
   * @param {number} [options.width=1]
   * @param {number} [options.height=1]
   * @param {number} [options.radius=0.5]
   * @param {boolean} [options.isTrigger=false]
   * @param {number} [options.layer=CollisionLayer.DEFAULT]
   * @param {number} [options.mask=0xffff]
   */
  constructor({
    type = 'aabb',
    width = 1,
    height = 1,
    radius = 0.5,
    isTrigger = false,
    layer = CollisionLayer.DEFAULT,
    mask = 0xffff,
  } = {}) {
    super();
    this.type = type;
    this.width = width;
    this.height = height;
    this.radius = radius;
    this.isTrigger = isTrigger;
    this.layer = layer;
    this.mask = mask;
    this.onCollide = null;
  }
}
Component.register(ColliderComponent);
