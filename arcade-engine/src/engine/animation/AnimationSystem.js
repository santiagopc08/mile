import { System } from '../ecs/System.js';
import { Easing } from './Easing.js';

/**
 * Lightweight Tween instance.
 */
class Tween {
  constructor(targetObject, targetProps, durationSec, easingFn, onComplete) {
    this.target = targetObject;
    this.targetProps = targetProps;
    this.startProps = {};
    this.duration = durationSec;
    this.easing = easingFn || Easing.linear;
    this.onComplete = onComplete;
    this.elapsed = 0;
    this.completed = false;

    // Capture initial property values
    Object.keys(targetProps).forEach((prop) => {
      this.startProps[prop] = targetObject[prop] !== undefined ? targetObject[prop] : 0;
    });
  }

  update(dt) {
    if (this.completed) return;
    this.elapsed += dt;
    const progress = Math.min(1.0, this.elapsed / this.duration);
    const easedT = this.easing(progress);

    Object.keys(this.targetProps).forEach((prop) => {
      const startVal = this.startProps[prop];
      const endVal = this.targetProps[prop];
      this.target[prop] = startVal + (endVal - startVal) * easedT;
    });

    if (progress >= 1.0) {
      this.completed = true;
      if (this.onComplete) this.onComplete();
    }
  }
}

/**
 * Engine Animation System for updating active Tweens.
 */
export class AnimationSystem extends System {
  constructor() {
    super();
    /** @type {Set<Tween>} */
    this.activeTweens = new Set();
  }

  /**
   * Create and register a new Tween.
   * @param {Object} targetObject 
   * @param {Object} targetProps 
   * @param {number} durationSec 
   * @param {Function} [easingFn] 
   * @param {Function} [onComplete] 
   * @returns {Tween}
   */
  createTween(targetObject, targetProps, durationSec, easingFn = Easing.linear, onComplete = null) {
    const tween = new Tween(targetObject, targetProps, durationSec, easingFn, onComplete);
    this.activeTweens.add(tween);
    return tween;
  }

  update(dt) {
    this.activeTweens.forEach((tween) => {
      tween.update(dt);
      if (tween.completed) {
        this.activeTweens.delete(tween);
      }
    });
  }

  clear() {
    this.activeTweens.clear();
  }
}
