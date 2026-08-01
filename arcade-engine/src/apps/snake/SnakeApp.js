import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { SnakeWorld, GameState } from './SnakeWorld.js';
import { SnakeDirection } from './SnakeActor.js';

/**
 * SnakeApp — RG-002 Reference Application.
 * Demonstrates grid-based gameplay using the SDK public API.
 */
export class SnakeApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_002_snake',
        name: 'RG-002 Snake Reference Application',
        version: '1.0.0',
        description: 'Grid-based Snake game built on ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    // 1. Create and initialize the Snake world
    this.world = new SnakeWorld(20, 15);
    this.world.initialize();

    // 2. Register world update system into Runtime
    this.runtime.registerSystem('SnakeWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    // 3. Start Runtime
    this.runtime.start();
  }

  /**
   * Handle directional input from the player.
   * @param {'UP'|'DOWN'|'LEFT'|'RIGHT'} direction
   */
  handleInput(direction) {
    if (this.world) {
      this.world.setDirection(direction);
    }
  }

  /**
   * Restart the game.
   */
  restart() {
    if (this.world) {
      this.world.restart();
    }
  }

  tick(dt = 0.016) {
    // 1. Step Runtime Execution Pipeline
    this.runtime.tick(dt);

    // 2. Submit Render View to RAL
    if (this.world) {
      const renderView = new RenderView(this.world.viewportManager.mainViewport);
      renderView.visibleActors = Array.from(
        this.world.actorRegistry.collection.actors.values()
      );
      this.renderingSystem.render(renderView);
    }
  }
}
