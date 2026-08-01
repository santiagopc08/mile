import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { SimulationWorld } from './SimulationWorld.js';

/**
 * SimulationApp — RA-001 Reference Application.
 * Official Reference Application proving ORBIT Arcade Platform as an interactive non-game simulation platform.
 */
export class SimulationApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'ra_001_simulation',
        name: 'RA-001 Interactive Simulation Reference Application',
        version: '1.0.0',
        description: 'Interactive non-game simulation and editor platform built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new SimulationWorld();
    this.world.initialize();

    this.runtime.registerSystem('SimulationWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  // Interactive Simulation API
  createEntity(id, name, x, y) { return this.world ? this.world.createEntity(id, name, x, y) : null; }
  deleteEntity(id) { return this.world ? this.world.deleteEntity(id) : false; }
  selectEntity(id) { return this.world ? this.world.selectEntity(id) : false; }
  clearSelection() { if (this.world) this.world.clearSelection(); }

  inspectEntity(id) { return this.world ? this.world.inspectEntity(id) : null; }
  modifyEntityProperty(id, key, value) { return this.world ? this.world.modifyEntityProperty(id, key, value) : false; }
  reparentEntity(childId, parentId) { return this.world ? this.world.reparentEntity(childId, parentId) : false; }

  // Undo / Redo Transactions
  undo() { return this.world ? this.world.undo() : false; }
  redo() { return this.world ? this.world.redo() : false; }

  // Scene Save & Load Persistence
  saveScene(name) { return this.world ? this.world.saveScene(name) : null; }
  loadScene(name) { return this.world ? this.world.loadScene(name) : false; }

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
