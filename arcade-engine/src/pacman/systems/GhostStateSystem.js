import { System } from '../../engine/ecs/System.js';
import { GhostAIComponent } from '../components/GhostAIComponent.js';
import { GhostState } from '../PacmanConstants.js';
import { PacmanConfig } from '../PacmanConfig.js';

export class GhostStateSystem extends System {
  constructor() {
    super();
    this.modeTimer = 0.0;
    this.isScatterMode = true;
  }

  init(world) {
    super.init(world);
    this.query = this.world.createQuery([GhostAIComponent]);
  }

  update(dt) {
    this.modeTimer += dt;

    // Cycle between Scatter (7s) and Chase (20s) modes
    const currentDuration = this.isScatterMode ? PacmanConfig.SCATTER_DURATION : PacmanConfig.CHASE_DURATION;
    if (this.modeTimer >= currentDuration) {
      this.modeTimer = 0.0;
      this.isScatterMode = !this.isScatterMode;
    }

    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const ghostAI = this.world.getComponent(entities[i], GhostAIComponent);

      if (ghostAI.state === GhostState.FRIGHTENED) {
        ghostAI.frightenedTimer -= dt;
        if (ghostAI.frightenedTimer <= 0) {
          ghostAI.state = this.isScatterMode ? GhostState.SCATTER : GhostState.CHASE;
        }
      } else if (ghostAI.state === GhostState.SCATTER || ghostAI.state === GhostState.CHASE) {
        ghostAI.state = this.isScatterMode ? GhostState.SCATTER : GhostState.CHASE;
      }
    }
  }

  triggerFrightenedMode() {
    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const ghostAI = this.world.getComponent(entities[i], GhostAIComponent);
      if (ghostAI.state !== GhostState.HOUSE && ghostAI.state !== GhostState.EYES) {
        ghostAI.state = GhostState.FRIGHTENED;
        ghostAI.frightenedTimer = PacmanConfig.FRIGHTENED_DURATION;
      }
    }
  }
}
