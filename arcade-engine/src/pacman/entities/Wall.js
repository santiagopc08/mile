import * as THREE from 'three';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { PacmanConfig } from '../PacmanConfig.js';

export function createWallEntity(world, scene, gridX, gridY, wallMaterial, wallGeo) {
  const mesh = new THREE.Mesh(wallGeo, wallMaterial);
  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;
  mesh.position.set(posX, posY, 0.4);
  mesh.castShadow = true;
  scene.add(mesh);

  const entity = world.createEntity(`Wall_${gridX}_${gridY}`);
  world.addComponent(entity, new TransformComponent(posX, posY, 0.4));
  world.addComponent(entity, new SpriteComponent({ mesh }));
  world.addComponent(entity, new ColliderComponent({
    type: 'aabb',
    width: PacmanConfig.GRID_SIZE,
    height: PacmanConfig.GRID_SIZE,
    layer: CollisionLayer.WALL,
  }));

  return entity;
}
