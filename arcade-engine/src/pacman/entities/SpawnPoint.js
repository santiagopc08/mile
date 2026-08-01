import { TransformComponent } from '../../components/TransformComponent.js';
import { PacmanConfig } from '../PacmanConfig.js';

export function createSpawnPointEntity(world, name, gridX, gridY) {
  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;

  const entity = world.createEntity(`SpawnPoint_${name}`);
  world.addComponent(entity, new TransformComponent(posX, posY, 0.0));
  return entity;
}
