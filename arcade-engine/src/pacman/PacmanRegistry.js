/**
 * Centralized Component, Asset, Audio & System Registry for Pac-Man Plugin.
 */
export class PacmanRegistry {
  /**
   * @param {import('../engine/ArcadeEngine.js').ArcadeEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
  }

  registerAssets() {
    const mgr = this.engine.assetManager;
    mgr.createPlaceholderTexture('pacman_texture', '#ffff00', 32);
    mgr.createPlaceholderTexture('blinky_texture', '#ff0000', 32);
    mgr.createPlaceholderTexture('pinky_texture', '#ffb8ff', 32);
    mgr.createPlaceholderTexture('inky_texture', '#00ffff', 32);
    mgr.createPlaceholderTexture('clyde_texture', '#ffb852', 32);
    mgr.createPlaceholderTexture('wall_texture', '#2121ff', 32);
  }

  registerAudio() {
    const audio = this.engine.audioManager;
    audio.registerSFX('intro', null);
    audio.registerSFX('pellet', null);
    audio.registerSFX('death', null);
    audio.registerSFX('ghost', null);
    audio.registerSFX('fruit', null);
    audio.registerSFX('power', null);
  }
}
