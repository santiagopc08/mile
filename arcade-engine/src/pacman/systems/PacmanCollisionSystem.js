import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';
import { GhostAIComponent } from '../components/GhostAIComponent.js';
import { PelletComponent } from '../components/PelletComponent.js';
import { FruitComponent } from '../components/FruitComponent.js';
import { PelletType, GhostState } from '../PacmanConstants.js';
import { PacmanConfig } from '../PacmanConfig.js';
import { PacmanEvents } from '../PacmanEvents.js';

export class PacmanCollisionSystem extends System {
  init(world) {
    super.init(world);
    this.pacmanQuery = this.world.createQuery([TransformComponent, PacmanGridComponent]);
    this.pelletQuery = this.world.createQuery([TransformComponent, PelletComponent]);
    this.ghostQuery = this.world.createQuery([TransformComponent, GhostAIComponent]);
    this.fruitQuery = this.world.createQuery([TransformComponent, FruitComponent]);
  }

  fixedUpdate(fixedDt) {
    if (!this.world || !this.world.engine) return;
    const pacmanEnts = this.world.getEntitiesForQuery(this.pacmanQuery);
    if (pacmanEnts.length === 0) return;

    const pacmanEnt = pacmanEnts[0];
    const pacmanGrid = this.world.getComponent(pacmanEnt, PacmanGridComponent);

    // 1. Pellet Collision Check
    const pellets = this.world.getEntitiesForQuery(this.pelletQuery);
    for (let i = 0; i < pellets.length; i++) {
      const pelletEnt = pellets[i];
      const pellet = this.world.getComponent(pelletEnt, PelletComponent);

      if (pellet.gridX === pacmanGrid.gridX && pellet.gridY === pacmanGrid.gridY) {
        // Eat Pellet
        const isPower = pellet.type === PelletType.POWER;
        const points = isPower ? PacmanConfig.POWER_PELLET_POINTS : PacmanConfig.DOT_POINTS;

        this.world.engine.eventBus.emit(PacmanEvents.SCORE_CHANGED, this.world.engine.uiBridge.state.score + points);
        this.world.engine.eventBus.emit(isPower ? PacmanEvents.POWER_PELLET_COLLECTED : PacmanEvents.PELLET_COLLECTED, { points });

        // Play SFX
        this.world.engine.audioManager.playSFX(isPower ? 'sfx_power_pellet' : 'sfx_waka', 0.5);

        // If Power Pellet, Trigger Frightened Mode on GhostStateSystem
        if (isPower) {
          this.world.systems.forEach((sys) => {
            if (typeof sys.triggerFrightenedMode === 'function') {
              sys.triggerFrightenedMode();
            }
          });
        }

        // Remove Pellet Mesh
        const sprite = this.world.getComponent(pelletEnt, SpriteComponent);
        if (sprite && sprite.mesh) {
          this.world.engine.rendererManager.scene.remove(sprite.mesh);
        }
        this.world.destroyEntity(pelletEnt);
      }
    }

    // 2. Fruit Collision Check
    const fruits = this.world.getEntitiesForQuery(this.fruitQuery);
    for (let i = 0; i < fruits.length; i++) {
      const fruitEnt = fruits[i];
      const fruitTrans = this.world.getComponent(fruitEnt, TransformComponent);
      const fruit = this.world.getComponent(fruitEnt, FruitComponent);

      const dx = Math.abs(fruitTrans.position.x - (PacmanConfig.ORIGIN_X + pacmanGrid.gridX * PacmanConfig.GRID_SIZE));
      const dy = Math.abs(fruitTrans.position.y - (PacmanConfig.ORIGIN_Y - pacmanGrid.gridY * PacmanConfig.GRID_SIZE));

      if (dx < 0.6 && dy < 0.6) {
        this.world.engine.eventBus.emit(PacmanEvents.SCORE_CHANGED, this.world.engine.uiBridge.state.score + fruit.points);
        this.world.engine.eventBus.emit(PacmanEvents.FRUIT_COLLECTED, { points: fruit.points });
        this.world.engine.audioManager.playSFX('sfx_fruit', 0.8);

        const sprite = this.world.getComponent(fruitEnt, SpriteComponent);
        if (sprite && sprite.mesh) {
          this.world.engine.rendererManager.scene.remove(sprite.mesh);
        }
        this.world.destroyEntity(fruitEnt);
      }
    }

    // 3. Ghost Collision Check
    const ghosts = this.world.getEntitiesForQuery(this.ghostQuery);
    for (let i = 0; i < ghosts.length; i++) {
      const ghostEnt = ghosts[i];
      const ghostAI = this.world.getComponent(ghostEnt, GhostAIComponent);

      if (ghostAI.gridX === pacmanGrid.gridX && ghostAI.gridY === pacmanGrid.gridY) {
        if (ghostAI.state === GhostState.FRIGHTENED) {
          // Pac-Man Eats Ghost!
          ghostAI.state = GhostState.EYES;
          const points = PacmanConfig.GHOST_BASE_POINTS;
          this.world.engine.eventBus.emit(PacmanEvents.SCORE_CHANGED, this.world.engine.uiBridge.state.score + points);
          this.world.engine.eventBus.emit(PacmanEvents.GHOST_KILLED, { ghost: ghostAI.type, points });
          this.world.engine.audioManager.playSFX('sfx_eat_ghost', 0.8);
        } else if (ghostAI.state === GhostState.SCATTER || ghostAI.state === GhostState.CHASE) {
          // Ghost Eats Pac-Man!
          this.world.engine.eventBus.emit(PacmanEvents.PACMAN_KILLED);
          this.world.engine.audioManager.playSFX('sfx_death', 0.9);
          this.world.engine.cameraManager.shake(0.8, 0.5);
          break;
        }
      }
    }
  }
}
