import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { PongWorld } from './PongWorld.js';

/**
 * PongApp — RG-003 Reference Application.
 * Demonstrates continuous real-time gameplay with multiple cooperating Systems.
 */
export class PongApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_003_pong',
        name: 'RG-003 Pong Reference Application',
        version: '1.0.0',
        description: 'Real-time Pong game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new PongWorld();
    this.world.initialize();

    this.runtime.registerSystem('PongWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  /** @param {number} dir  -1 up, 0 idle, +1 down */
  setPlayerInput(dir) {
    if (this.world) this.world.setPlayerInput(dir);
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
