import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { BreakoutWorld } from './BreakoutWorld.js';

/**
 * BreakoutApp — RG-004 Reference Application.
 * Demonstrates dynamic scene mutation with continuous physics.
 */
export class BreakoutApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_004_breakout',
        name: 'RG-004 Breakout Reference Application',
        version: '1.0.0',
        description: 'Breakout game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new BreakoutWorld();
    this.world.initialize();

    this.runtime.registerSystem('BreakoutWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  /** @param {number} dir  -1 left, 0 idle, +1 right */
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
