import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { HillClimbWorld } from './HillClimbWorld.js';

/**
 * HillClimbApp — RG-008 Reference Application.
 * Validates Physics Framework, Wheel Joint Constraints, Composite Vehicles, and Procedural Heightmap Terrain.
 */
export class HillClimbApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_008_hillclimb',
        name: 'RG-008 Hill Climb Reference Application',
        version: '1.0.0',
        description: 'Physics & Suspension Constraints reference game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new HillClimbWorld();
    this.world.initialize();

    this.runtime.registerSystem('HillClimbWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  /**
   * Set vehicle control input (gas, brake).
   */
  setControls(gas, brake) {
    if (this.world) this.world.setControls(gas, brake);
  }

  togglePause() { if (this.world) this.world.togglePause(); }
  restart() { if (this.world) this.world.restart(); }

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
