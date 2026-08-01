import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { TetrisWorld } from './TetrisWorld.js';

/**
 * TetrisApp — RG-007 Reference Application.
 * Validates composite actors, structural grid mutation, replay recording, and discrete world determinism.
 */
export class TetrisApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_007_tetris',
        name: 'RG-007 Tetris Reference Application',
        version: '1.0.0',
        description: 'Composite Actors & Structural Grid Mutation reference game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    this.world = new TetrisWorld();
    this.world.initialize();

    this.runtime.registerSystem('TetrisWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    this.runtime.start();
  }

  // Player Controls
  moveLeft() { if (this.world) this.world.moveLeft(); }
  moveRight() { if (this.world) this.world.moveRight(); }
  rotateCW() { if (this.world) this.world.rotateCW(); }
  rotateCCW() { if (this.world) this.world.rotateCCW(); }
  softDrop() { if (this.world) this.world.softDrop(); }
  hardDrop() { if (this.world) this.world.hardDrop(); }
  holdPiece() { if (this.world) this.world.holdPiece(); }

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
