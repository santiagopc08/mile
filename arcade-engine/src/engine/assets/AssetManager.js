import * as THREE from 'three';

/**
 * Asset Manager with Preloading, Caching, and Automatic Disposal.
 */
export class AssetManager {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.fileLoader = new THREE.FileLoader();

    /** @type {Map<string, THREE.Texture>} */
    this.textures = new Map();
    /** @type {Map<string, AudioBuffer>} */
    this.audioBuffers = new Map();
    /** @type {Map<string, any>} */
    this.jsonCache = new Map();
  }

  /**
   * Load a Texture.
   * @param {string} key 
   * @param {string} url 
   * @returns {Promise<THREE.Texture>}
   */
  async loadTexture(key, url) {
    if (this.textures.has(key)) {
      return this.textures.get(key);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.magFilter = THREE.NearestFilter; // Sharp arcade pixels
          texture.minFilter = THREE.NearestFilter;
          this.textures.set(key, texture);
          resolve(texture);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  /**
   * Load Audio Buffer.
   * @param {AudioContext} audioCtx 
   * @param {string} key 
   * @param {string} url 
   * @returns {Promise<AudioBuffer>}
   */
  async loadAudio(audioCtx, key, url) {
    if (this.audioBuffers.has(key)) {
      return this.audioBuffers.get(key);
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(key, audioBuffer);
    return audioBuffer;
  }

  /**
   * Load JSON config.
   * @param {string} key 
   * @param {string} url 
   * @returns {Promise<any>}
   */
  async loadJSON(key, url) {
    if (this.jsonCache.has(key)) {
      return this.jsonCache.get(key);
    }
    const response = await fetch(url);
    const json = await response.json();
    this.jsonCache.set(key, json);
    return json;
  }

  /**
   * Create procedural canvas texture (fallback sprite / placeholder).
   * @param {string} key 
   * @param {string} colorHex 
   * @param {number} [size=32] 
   * @returns {THREE.CanvasTexture}
   */
  createPlaceholderTexture(key, colorHex = '#ff0055', size = 32) {
    if (this.textures.has(key)) {
      return this.textures.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    this.textures.set(key, texture);
    return texture;
  }

  getTexture(key) {
    return this.textures.get(key) || null;
  }

  getAudio(key) {
    return this.audioBuffers.get(key) || null;
  }

  getJSON(key) {
    return this.jsonCache.get(key) || null;
  }

  /**
   * Dispose all textures & clear caches.
   */
  clear() {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.audioBuffers.clear();
    this.jsonCache.clear();
  }
}
