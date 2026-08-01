import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { PacmanWorld } from './PacmanWorld.js';

/**
 * PacmanApp — RG-005 Reference Application.
 * Official reference implementation of Cognitive Framework, Navigation, and Discrete Worlds.
 */
export class PacmanApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_005_pacman',
        name: 'RG-005 Pac-Man Reference Application',
        version: '1.0.0',
        description: 'Official Cognitive Framework & Navigation Reference Game',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new PacmanWorld();
    this.world.initialize();

    this.runtime.registerSystem('PacmanWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  /**
   * Set player direction intent ('UP'|'DOWN'|'LEFT'|'RIGHT').
   */
  setDirection(dirName) {
    if (this.world) this.world.setBufferedDirection(dirName);
  }

  togglePause() {
    if (this.world) this.world.togglePause();
  }

  restart() {
    if (this.world) this.world.restart();
  }

  tick(dt = 0.016) {
    this.runtime.tick(dt);

    if (this.world) {
      const renderView = new RenderView(this.world.viewportManager.mainViewport);
      renderView.visibleActors = Array.from(
        this.world.actorRegistry.collection.actors.values()
      );
      this.renderingSystem.render(renderView);
    }
  }
}
