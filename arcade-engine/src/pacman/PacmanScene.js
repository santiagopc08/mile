import { BaseScene } from '../engine/scene/BaseScene.js';
import { PacmanLevelLoader } from './PacmanLevelLoader.js';
import { PacmanEvents } from './PacmanEvents.js';
import mapData from './assets/maps/classic.json';

export class PacmanScene extends BaseScene {
  constructor() {
    super('PacmanScene');
    this.levelLoader = null;
  }

  onEnter() {
    if (!this.engine) return;

    // Register Input Actions
    const input = this.engine.inputManager;
    input.registerAction('MOVE_LEFT', { keys: ['ArrowLeft', 'KeyA'] });
    input.registerAction('MOVE_RIGHT', { keys: ['ArrowRight', 'KeyD'] });
    input.registerAction('MOVE_UP', { keys: ['ArrowUp', 'KeyW'] });
    input.registerAction('MOVE_DOWN', { keys: ['ArrowDown', 'KeyS'] });
    input.registerAction('PAUSE', { keys: ['Escape', 'KeyP'] });

    // Build Maze & Spawn Entities
    this.levelLoader = new PacmanLevelLoader(this.engine);
    this.levelLoader.loadLevel(mapData);

    // Initial Telemetry Event Emission
    this.engine.eventBus.emit(PacmanEvents.LIVES_CHANGED, 3);
    this.engine.eventBus.emit(PacmanEvents.LEVEL_CHANGED, 1);
  }

  onUpdate(dt) {
    if (!this.engine) return;
    const input = this.engine.inputManager;

    if (input.wasActionJustPressed('PAUSE')) {
      if (this.engine.loop.isPaused) {
        this.engine.resume();
      } else {
        this.engine.pause();
      }
    }
  }

  onExit() {
    if (this.engine) {
      this.engine.world.clear();
    }
  }
}
