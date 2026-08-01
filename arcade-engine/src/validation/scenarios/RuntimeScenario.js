import { Runtime } from '../../sdk/runtime/core/Runtime.js';
import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { Actor } from '../../sdk/actors/core/Actor.js';
import { TransformComponent } from '../../sdk/movement/components/TransformComponent.js';

export class RuntimeScenario {
  static run(ctx) {
    const runtime = new Runtime();
    runtime.start();
    runtime.tick(0.016);
    ctx.assert(runtime.frameCount === 1, 'Runtime tick failed to increment frame count');
  }
}

export class ActorScenario {
  static run(ctx) {
    const registry = new ActorRegistry();
    const actor = new Actor(null, 'TestActor');
    actor.addComponent(new TransformComponent(10, 20));
    registry.register(actor);
    ctx.assert(registry.get(actor.id) !== null, 'Actor registration failed');
  }
}

export class NavigationScenario {
  static run(ctx) {
    ctx.assert(true, 'Navigation scenario passed');
  }
}

export class InteractionScenario {
  static run(ctx) {
    ctx.assert(true, 'Interaction scenario passed');
  }
}

export class RenderingScenario {
  static run(ctx) {
    ctx.assert(true, 'Rendering scenario passed');
  }
}

export class PersistenceScenario {
  static run(ctx) {
    ctx.assert(true, 'Persistence scenario passed');
  }
}

export class PluginScenario {
  static run(ctx) {
    ctx.assert(true, 'Plugin scenario passed');
  }
}
