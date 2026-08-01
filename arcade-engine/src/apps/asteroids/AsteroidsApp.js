import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { AsteroidsWorld } from './AsteroidsWorld.js';

/**
 * AsteroidsApp — RG-006 Reference Application.
 * Validates continuous physics, entity pooling, toroidal wrapping, and hierarchical destruction.
 */
export class AsteroidsApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_006_asteroids',
        name: 'RG-006 Asteroids Reference Application',
        version: '1.0.0',
        description: 'Continuous physics & entity pooling reference game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new AsteroidsWorld();
    this.world.initialize();

    this.runtime.registerSystem('AsteroidsWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  /**
   * Set ship input state.
   * @param {number} rotateDir -1 left, 0 idle, +1 right
   * @param {boolean} thrust
   * @param {boolean} shoot
   */
  setPlayerInput(rotateDir, thrust, shoot) {
    if (this.world) this.world.setPlayerInput(rotateDir, thrust, shoot);
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
