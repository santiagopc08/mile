import { PacmanRegistry } from './PacmanRegistry.js';
import { PacmanLevelLoader } from './PacmanLevelLoader.js';
import mapData from './assets/maps/classic.json';

export class PacmanBootstrap {
  /**
   * @param {import('../engine/ArcadeEngine.js').ArcadeEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
    this.registry = new PacmanRegistry(engine);
    this.levelLoader = new PacmanLevelLoader(engine);
  }

  async run() {
    console.log('[PacmanBootstrap] Starting Phase 1 Boot Sequence...');

    // 1. Register Assets & Audio
    this.registry.registerAssets();
    this.registry.registerAudio();

    // 2. Load Level Structural Infrastructure
    this.levelLoader.loadLevel(mapData);

    console.log('[PacmanBootstrap] Phase 1 Boot Sequence Complete.');
  }
}
