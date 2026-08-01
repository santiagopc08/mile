import * as THREE from 'three';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { PacmanConfig } from '../PacmanConfig.js';

export function createPortalEntity(world, scene, name, gridX, gridY) {
  const geo = new THREE.TorusGeometry(0.5, 0.1, 12, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x880022 });
  const mesh = new THREE.Mesh(geo, mat);

  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;
  mesh.position.set(posX, posY, 0.3);
  scene.add(mesh);

  const entity = world.createEntity(`Portal_${name}`);
  world.addComponent(entity, new TransformComponent(posX, posY, 0.3));
  world.addComponent(entity, new SpriteComponent({ mesh }));
  world.addComponent(entity, new ColliderComponent({
    type: 'circle',
    radius: 0.6,
    isTrigger: true,
    layer: CollisionLayer.POWERUP,
  }));

  return entity;
}
