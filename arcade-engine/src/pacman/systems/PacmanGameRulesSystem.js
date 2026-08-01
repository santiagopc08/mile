import { System } from '../../engine/ecs/System.js';
import { PelletComponent } from '../components/PelletComponent.js';
import { PacmanEvents } from '../PacmanEvents.js';
import { PacmanBalance } from '../PacmanBalance.js';
import { PacmanSaveManager } from '../PacmanSaveManager.js';

export class PacmanGameRulesSystem extends System {
  constructor() {
    super();
    this.awardedExtraLife = false;
    this.saveManager = new PacmanSaveManager();
  }

  init(world) {
    super.init(world);
    this.pelletQuery = this.world.createQuery([PelletComponent]);

    if (this.world && this.world.engine) {
      const bus = this.world.engine.eventBus;
      const bridge = this.world.engine.uiBridge;

      bus.on(PacmanEvents.SCORE_CHANGED, (newScore) => {
        // High Score Check
        const highScore = Math.max(newScore, this.saveManager.getHighScore());
        if (highScore > this.saveManager.getHighScore()) {
          this.saveManager.setHighScore(highScore);
        }
        bus.emit(PacmanEvents.HIGH_SCORE_CHANGED, highScore);

        // Extra Life at 10,000 Points
        if (newScore >= PacmanBalance.EXTRA_LIFE_THRESHOLD && !this.awardedExtraLife) {
          this.awardedExtraLife = true;
          bridge.setState({ lives: bridge.state.lives + 1 });
          bus.emit(PacmanEvents.EXTRA_LIFE);
          this.world.engine.audioManager.playSFX('sfx_extra_life', 1.0);
        }
      });

      bus.on(PacmanEvents.PACMAN_KILLED, () => {
        const remainingLives = bridge.state.lives - 1;
        bridge.setState({ lives: remainingLives });
        bus.emit(PacmanEvents.LIVES_CHANGED, remainingLives);

        if (remainingLives <= 0) {
          bus.emit(PacmanEvents.GAME_OVER);
        } else {
          // Reset Pac-Man & Ghost Positions
          this.world.systems.forEach((sys) => {
            if (typeof sys.resetPositions === 'function') {
              sys.resetPositions();
            }
          });
        }
      });
    }
  }

  update(dt) {
    // Check Level Completion (All Pellets Eaten)
    const pellets = this.world.getEntitiesForQuery(this.pelletQuery);
    if (pellets.length === 0 && this.world && this.world.engine) {
      this.world.engine.eventBus.emit(PacmanEvents.LEVEL_COMPLETED);
    }
  }
}
