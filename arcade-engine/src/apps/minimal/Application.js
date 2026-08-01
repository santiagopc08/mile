import { Application } from '../../platform/core/Application.js';
import { ApplicationManifest } from '../../platform/core/ApplicationManifest.js';
import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { RenderingSystem, RenderView, HeadlessRendererAdapter } from '../../sdk/rendering/index.js';
import { MinimalWorld } from './World.js';
import { PlayerActorFactory } from './Player.js';

export class MinimalApp extends Application {
  constructor() {
    super(
      new ApplicationManifest({
        id: 'rg_001_minimal',
        name: 'RG-001 Minimal Reference Application',
        version: '1.0.0',
        description: 'Official minimal reference implementation of ORBIT Arcade Platform',
      })
    );

    this.runtime = new Runtime();
    this.world = null;
    this.renderingSystem = new RenderingSystem(new HeadlessRendererAdapter());
  }

  initialize() {
    // 1. Create Empty World
    this.world = new MinimalWorld();

    // 2. Spawn Player Actor
    const player = PlayerActorFactory.createPlayer('player_main', 0, 0);
    this.world.spawnPlayer(player);

    // 3. Register custom update system into Runtime PRE_UPDATE stage
    this.runtime.registerSystem('MinimalWorldSystem', {
      update: (dt) => {
        if (this.world) this.world.update(dt);
      },
    });

    // 4. Start Runtime
    this.runtime.start();
  }

  handleInput(dx, dy) {
    if (!this.world || !this.world.playerActor) return;
    const movement = this.world.playerActor.getComponent('MovementComponent');
    if (movement && movement.direction) {
      movement.direction.dx = dx;
      movement.direction.dy = dy;
    }
  }

  tick(dt = 0.016) {
    // 1. Step Runtime Execution Pipeline
    this.runtime.tick(dt);

    // 2. Submit Render View to RAL
    if (this.world) {
      const renderView = new RenderView(this.world.viewportManager.mainViewport);
      renderView.visibleActors = Array.from(this.world.actorRegistry.collection.actors.values());
      this.renderingSystem.render(renderView);
    }
  }
}
