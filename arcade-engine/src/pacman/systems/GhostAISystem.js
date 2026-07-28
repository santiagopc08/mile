import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { GhostAIComponent } from '../components/GhostAIComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';
import { GhostType, GhostState, Direction } from '../PacmanConstants.js';
import { PacmanConfig } from '../PacmanConfig.js';

export class GhostAISystem extends System {
  /**
   * @param {string[][]} mapMatrix 
   */
  constructor(mapMatrix) {
    super();
    this.mapMatrix = mapMatrix;
  }

  init(world) {
    super.init(world);
    this.ghostQuery = this.world.createQuery([TransformComponent, GhostAIComponent]);
    this.pacmanQuery = this.world.createQuery([TransformComponent, PacmanGridComponent]);
  }

  fixedUpdate(fixedDt) {
    const pacmanEntities = this.world.getEntitiesForQuery(this.pacmanQuery);
    if (pacmanEntities.length === 0) return;

    const pacmanGrid = this.world.getComponent(pacmanEntities[0], PacmanGridComponent);
    const blinkyEntity = this._getBlinkyEntity();

    const ghosts = this.world.getEntitiesForQuery(this.ghostQuery);

    for (let i = 0; i < ghosts.length; i++) {
      const entity = ghosts[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const ghostAI = this.world.getComponent(entity, GhostAIComponent);

      let speed = PacmanConfig.GHOST_NORMAL_SPEED;
      if (ghostAI.state === GhostState.FRIGHTENED) speed = PacmanConfig.GHOST_FRIGHTENED_SPEED;
      else if (ghostAI.state === GhostState.EYES) speed = PacmanConfig.GHOST_EYES_SPEED;

      // Handle House Release Timer
      if (ghostAI.state === GhostState.HOUSE) {
        ghostAI.houseTimer += fixedDt;
        if (ghostAI.type === GhostType.PINKY && ghostAI.houseTimer >= 1.0) ghostAI.state = GhostState.LEAVING_HOUSE;
        else if (ghostAI.type === GhostType.INKY && ghostAI.houseTimer >= 3.0) ghostAI.state = GhostState.LEAVING_HOUSE;
        else if (ghostAI.type === GhostType.CLYDE && ghostAI.houseTimer >= 5.0) ghostAI.state = GhostState.LEAVING_HOUSE;
      }

      if (ghostAI.state === GhostState.LEAVING_HOUSE) {
        ghostAI.gridX = 14;
        ghostAI.gridY = 11;
        ghostAI.state = GhostState.CHASE;
      }

      if (ghostAI.state !== GhostState.HOUSE) {
        ghostAI.progress += speed * fixedDt;

        if (ghostAI.progress >= 1.0) {
          ghostAI.progress = 0.0;
          ghostAI.gridX += ghostAI.currentDirection.x;
          ghostAI.gridY -= ghostAI.currentDirection.y;

          // Warp Portals
          if (ghostAI.gridX < 0) ghostAI.gridX = PacmanConfig.GRID_WIDTH - 1;
          else if (ghostAI.gridX >= PacmanConfig.GRID_WIDTH) ghostAI.gridX = 0;

          // Compute Target Tile based on AI Personality
          this._calculateTargetTile(ghostAI, pacmanGrid, blinkyEntity);

          // Select Best Valid Direction
          ghostAI.currentDirection = this._selectBestDirection(ghostAI);
        }
      }

      // Smooth World Position
      const worldX = PacmanConfig.ORIGIN_X + (ghostAI.gridX + ghostAI.currentDirection.x * ghostAI.progress) * PacmanConfig.GRID_SIZE;
      const worldY = PacmanConfig.ORIGIN_Y - (ghostAI.gridY - ghostAI.currentDirection.y * ghostAI.progress) * PacmanConfig.GRID_SIZE;

      transform.position.x = worldX;
      transform.position.y = worldY;
    }
  }

  _calculateTargetTile(ghostAI, pacmanGrid, blinkyEntity) {
    if (ghostAI.state === GhostState.EYES) {
      ghostAI.targetTile = { x: 14, y: 14 }; // Return to House Door
      if (ghostAI.gridX === 14 && (ghostAI.gridY === 14 || ghostAI.gridY === 11)) {
        ghostAI.state = GhostState.CHASE;
      }
      return;
    }

    if (ghostAI.state === GhostState.SCATTER) {
      switch (ghostAI.type) {
        case GhostType.BLINKY: ghostAI.targetTile = { x: 27, y: 0 }; break;
        case GhostType.PINKY:  ghostAI.targetTile = { x: 0, y: 0 }; break;
        case GhostType.INKY:   ghostAI.targetTile = { x: 27, y: 30 }; break;
        case GhostType.CLYDE:  ghostAI.targetTile = { x: 0, y: 30 }; break;
      }
      return;
    }

    if (ghostAI.state === GhostState.FRIGHTENED) {
      ghostAI.targetTile = { x: Math.floor(Math.random() * 28), y: Math.floor(Math.random() * 31) };
      return;
    }

    // CHASE Mode Target Calculations
    switch (ghostAI.type) {
      case GhostType.BLINKY: // Direct Chase
        ghostAI.targetTile = { x: pacmanGrid.gridX, y: pacmanGrid.gridY };
        break;

      case GhostType.PINKY: // 4 Tiles Ahead
        ghostAI.targetTile = {
          x: pacmanGrid.gridX + pacmanGrid.currentDirection.x * 4,
          y: pacmanGrid.gridY - pacmanGrid.currentDirection.y * 4,
        };
        break;

      case GhostType.INKY: // Vector from Blinky to 2 Tiles ahead
        if (blinkyEntity) {
          const blinkyAI = this.world.getComponent(blinkyEntity, GhostAIComponent);
          const aheadX = pacmanGrid.gridX + pacmanGrid.currentDirection.x * 2;
          const aheadY = pacmanGrid.gridY - pacmanGrid.currentDirection.y * 2;
          const vecX = aheadX - blinkyAI.gridX;
          const vecY = aheadY - blinkyAI.gridY;
          ghostAI.targetTile = { x: aheadX + vecX, y: aheadY + vecY };
        } else {
          ghostAI.targetTile = { x: pacmanGrid.gridX, y: pacmanGrid.gridY };
        }
        break;

      case GhostType.CLYDE: // Chase if dist > 8, Scatter if dist <= 8
        const dx = ghostAI.gridX - pacmanGrid.gridX;
        const dy = ghostAI.gridY - pacmanGrid.gridY;
        const distSq = dx * dx + dy * dy;
        if (distSq > 64) {
          ghostAI.targetTile = { x: pacmanGrid.gridX, y: pacmanGrid.gridY };
        } else {
          ghostAI.targetTile = { x: 0, y: 30 };
        }
        break;
    }
  }

  _selectBestDirection(ghostAI) {
    const possibleDirs = [Direction.UP, Direction.LEFT, Direction.DOWN, Direction.RIGHT];
    let bestDir = ghostAI.currentDirection;
    let minDistanceSq = Infinity;

    for (let i = 0; i < possibleDirs.length; i++) {
      const dir = possibleDirs[i];

      // No 180-degree turns allowed unless turning frightened
      if (dir.x === -ghostAI.currentDirection.x && dir.y === -ghostAI.currentDirection.y) {
        continue;
      }

      const nextX = ghostAI.gridX + dir.x;
      const nextY = ghostAI.gridY - dir.y;

      if (this._isValidTile(nextX, nextY, ghostAI.state)) {
        const dx = nextX - ghostAI.targetTile.x;
        const dy = nextY - ghostAI.targetTile.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestDir = dir;
        }
      }
    }

    return bestDir;
  }

  _isValidTile(gx, gy, state) {
    if ((gx < 0 || gx >= PacmanConfig.GRID_WIDTH) && gy === 14) return true;
    if (gy < 0 || gy >= this.mapMatrix.length || gx < 0 || gx >= this.mapMatrix[0].length) return false;
    const tileChar = this.mapMatrix[gy][gx];
    if (tileChar === '1') return false; // Wall
    if (tileChar === '9' && state !== GhostState.EYES && state !== GhostState.LEAVING_HOUSE) return false;
    return true;
  }

  _getBlinkyEntity() {
    const ghosts = this.world.getEntitiesForQuery(this.ghostQuery);
    for (let i = 0; i < ghosts.length; i++) {
      const ai = this.world.getComponent(ghosts[i], GhostAIComponent);
      if (ai && ai.type === GhostType.BLINKY) return ghosts[i];
    }
    return null;
  }
}
