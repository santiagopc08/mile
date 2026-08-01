import * as THREE from 'three';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { GhostAIComponent } from '../components/GhostAIComponent.js';
import { PacmanConfig } from '../PacmanConfig.js';

const GHOST_COLORS = {
  BLINKY: 0xff0000,
  PINKY:  0xffb8ff,
  INKY:   0x00ffff,
  CLYDE:  0xffb852,
};

export function createGhostEntity(world, scene, type = 'BLINKY', gridX = 14, gridY = 11) {
  const geo = new THREE.CapsuleGeometry(0.4, 0.3, 8, 16);
  const color = GHOST_COLORS[type] || 0xff0000;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);

  // Add Eyes
  const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.15, 0.2, 0.3);
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pupilMat);
  leftPupil.position.set(-0.15, 0.22, 0.38);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.15, 0.2, 0.3);
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pupilMat);
  rightPupil.position.set(0.15, 0.22, 0.38);

  mesh.add(leftEye);
  mesh.add(leftPupil);
  mesh.add(rightEye);
  mesh.add(rightPupil);

  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;
  mesh.position.set(posX, posY, 0.5);
  scene.add(mesh);

  const entity = world.createEntity(`Ghost_${type}`);
  world.addComponent(entity, new TransformComponent(posX, posY, 0.5));
  world.addComponent(entity, new SpriteComponent({ mesh }));
  // Sin GhostAIComponent, GhostAISystem no lo ve y el fantasma nunca piensa ni se mueve.
  world.addComponent(entity, new GhostAIComponent(type, gridX, gridY));
  world.addComponent(entity, new ColliderComponent({
    type: 'circle',
    radius: 0.45,
    layer: CollisionLayer.ENEMY,
    mask: CollisionLayer.PLAYER,
  }));

  return entity;
}
