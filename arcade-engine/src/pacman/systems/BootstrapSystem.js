import { System } from '../../engine/ecs/System.js';
import { PacmanEvents } from '../PacmanEvents.js';

export class BootstrapSystem extends System {
  constructor() {
    super();
    this.bootstrapped = false;
  }

  update(dt) {
    if (this.bootstrapped || !this.world || !this.world.engine) return;

    this.bootstrapped = true;
    const bus = this.world.engine.eventBus;
    const bridge = this.world.engine.uiBridge;

    bridge.setState({
      pluginLoaded: true,
      mapLoaded: true,
      assetsLoaded: true,
      version: '1.0.0-phase1',
    });

    bus.emit(PacmanEvents.ASSETS_LOADED);
    bus.emit(PacmanEvents.MAP_LOADED);
    bus.emit(PacmanEvents.PACMAN_LOADED, { status: 'READY_PHASE1' });
    console.log('[PacmanBootstrapSystem] Phase 1 Infrastructure Ready & PacmanLoaded Emitted.');
  }
}
