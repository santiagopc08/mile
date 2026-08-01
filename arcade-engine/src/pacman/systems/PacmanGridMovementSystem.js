import { System } from '../../engine/ecs/System.js';
import { TransformComponent } from '../../components/TransformComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';
import { Direction } from '../PacmanConstants.js';
import { PacmanConfig } from '../PacmanConfig.js';
import { PacmanBalance } from '../PacmanBalance.js';

export class PacmanGridMovementSystem extends System {
  /**
   * @param {string[][]} mapMatrix 
   */
  constructor(mapMatrix) {
    super();
    this.mapMatrix = mapMatrix;
  }

  init(world) {
    super.init(world);
    this.query = this.world.createQuery([TransformComponent, PacmanGridComponent]);
  }

  fixedUpdate(fixedDt) {
    if (!this.world || !this.world.engine) return;
    const input = this.world.engine.inputManager;

    // 1. Buffer Turn Input
    if (input.isActionActive('MOVE_LEFT')) this._bufferDir(Direction.LEFT);
    else if (input.isActionActive('MOVE_RIGHT')) this._bufferDir(Direction.RIGHT);
    else if (input.isActionActive('MOVE_UP')) this._bufferDir(Direction.UP);
    else if (input.isActionActive('MOVE_DOWN')) this._bufferDir(Direction.DOWN);

    const entities = this.world.getEntitiesForQuery(this.query);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const transform = this.world.getComponent(entity, TransformComponent);
      const gridComp = this.world.getComponent(entity, PacmanGridComponent);

      // Check if we can turn in buffered direction
      if (gridComp.bufferedDirection !== Direction.NONE && this._canMove(gridComp.gridX, gridComp.gridY, gridComp.bufferedDirection)) {
        gridComp.currentDirection = gridComp.bufferedDirection;
        gridComp.bufferedDirection = Direction.NONE;
      }

      if (gridComp.currentDirection !== Direction.NONE) {
        if (this._canMove(gridComp.gridX, gridComp.gridY, gridComp.currentDirection)) {
          gridComp.progress += PacmanBalance.PACMAN_SPEED * fixedDt;

          if (gridComp.progress >= 1.0) {
            gridComp.progress = 0.0;
            gridComp.gridX += gridComp.currentDirection.x;
            gridComp.gridY -= gridComp.currentDirection.y; // Invert grid Y for top-down

            // Left/Right Portal Warp
            if (gridComp.gridX < 0) gridComp.gridX = PacmanConfig.GRID_WIDTH - 1;
            else if (gridComp.gridX >= PacmanConfig.GRID_WIDTH) gridComp.gridX = 0;
          }
        } else {
          gridComp.progress = 0.0;
        }
      }

      // Smooth World Position Interpolation
      const worldX = PacmanConfig.ORIGIN_X + (gridComp.gridX + gridComp.currentDirection.x * gridComp.progress) * PacmanConfig.GRID_SIZE;
      const worldY = PacmanConfig.ORIGIN_Y - (gridComp.gridY - gridComp.currentDirection.y * gridComp.progress) * PacmanConfig.GRID_SIZE;

      transform.position.x = worldX;
      transform.position.y = worldY;
    }
  }

  _bufferDir(dir) {
    const entities = this.world.getEntitiesForQuery(this.query);
    if (entities.length > 0) {
      const gridComp = this.world.getComponent(entities[0], PacmanGridComponent);
      if (gridComp) gridComp.bufferedDirection = dir;
    }
  }

  _canMove(gx, gy, dir) {
    if (!this.mapMatrix) return false;
    const targetX = gx + dir.x;
    const targetY = gy - dir.y;

    // Portal Wrap Check
    if ((targetX < 0 || targetX >= PacmanConfig.GRID_WIDTH) && gy === 14) {
      return true;
    }

    if (targetY < 0 || targetY >= this.mapMatrix.length || targetX < 0 || targetX >= this.mapMatrix[0].length) {
      return false;
    }

    const tileChar = this.mapMatrix[targetY][targetX];
    return tileChar !== '1' && tileChar !== '9'; // '1' is Wall, '9' is Ghost House Door
  }
}
