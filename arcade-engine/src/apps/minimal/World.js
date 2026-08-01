import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';

export class MinimalWorld {
  constructor(name = 'MinimalWorld') {
    this.name = name;
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.playerActor = null;
  }

  spawnPlayer(playerActor) {
    this.playerActor = playerActor;
    this.actorRegistry.register(playerActor);
  }

  update(dt) {
    // 1. Update actor registry logic & components
    this.actorRegistry.update(dt);

    // 2. Update viewports & camera controllers
    this.viewportManager.update(dt);
  }
}
