import * as THREE from 'three';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { PacmanGridComponent } from '../components/PacmanGridComponent.js';
import { PacmanConfig } from '../PacmanConfig.js';

export function createPacmanEntity(world, scene, gridX = 14, gridY = 23) {
  const geo = new THREE.SphereGeometry(0.5, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x444400,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;
  mesh.position.set(posX, posY, 0.5);
  scene.add(mesh);

  const entity = world.createEntity('Pacman');
  world.addComponent(entity, new TransformComponent(posX, posY, 0.5));
  world.addComponent(entity, new SpriteComponent({ mesh }));
  // Sin PacmanGridComponent, PacmanGridMovementSystem no lo ve y Pac-Man no se mueve.
  world.addComponent(entity, new PacmanGridComponent(gridX, gridY));
  world.addComponent(entity, new ColliderComponent({
    type: 'circle',
    radius: 0.5,
    layer: CollisionLayer.PLAYER,
    mask: CollisionLayer.WALL | CollisionLayer.ENEMY,
  }));

  return entity;
}
