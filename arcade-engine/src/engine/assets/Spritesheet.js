import * as THREE from 'three';

/**
 * Spritesheet UV Coordinate Mapper for 2D Arcade Sprites.
 */
export class Spritesheet {
  /**
   * @param {THREE.Texture} texture - Base texture
   * @param {number} columns - Number of horizontal sprite frames
   * @param {number} rows - Number of vertical sprite frames
   */
  constructor(texture, columns = 1, rows = 1) {
    this.texture = texture;
    this.columns = columns;
    this.rows = rows;
    this.frameWidth = 1.0 / columns;
    this.frameHeight = 1.0 / rows;
  }

  /**
   * Configure texture repeat & offset for a specific frame index.
   * @param {THREE.Texture} textureInstance 
   * @param {number} frameIndex 
   */
  setFrame(textureInstance, frameIndex) {
    const col = frameIndex % this.columns;
    const row = Math.floor(frameIndex / this.columns);

    textureInstance.repeat.set(this.frameWidth, this.frameHeight);
    textureInstance.offset.set(col * this.frameWidth, 1.0 - (row + 1) * this.frameHeight);
  }
}
