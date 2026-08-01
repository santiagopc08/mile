import * as THREE from 'three';
import { TransformComponent } from '../../components/TransformComponent.js';
import { SpriteComponent } from '../../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../../components/ColliderComponent.js';
import { PelletComponent } from '../components/PelletComponent.js';
import { PelletType } from '../PacmanConstants.js';
import { PacmanConfig } from '../PacmanConfig.js';
import { PacmanBalance } from '../PacmanBalance.js';

// Geometrías y materiales compartidos: hay ~246 pellets por nivel, así que
// instanciar uno nuevo por entidad desperdicia memoria y draw calls.
const dotGeo = new THREE.SphereGeometry(0.12, 8, 8);
const dotMaterial = new THREE.MeshStandardMaterial({ color: 0xffb8ae, roughness: 0.1 });

const powerGeo = new THREE.SphereGeometry(0.3, 12, 12);
const powerMaterial = new THREE.MeshStandardMaterial({ color: 0xffb8ae, emissive: 0xff8866 });

export function createPelletEntity(world, scene, gridX, gridY, type = PelletType.DOT) {
  const isPower = type === PelletType.POWER;

  const mesh = new THREE.Mesh(
    isPower ? powerGeo : dotGeo,
    isPower ? powerMaterial : dotMaterial
  );

  const posX = PacmanConfig.ORIGIN_X + gridX * PacmanConfig.GRID_SIZE;
  const posY = PacmanConfig.ORIGIN_Y - gridY * PacmanConfig.GRID_SIZE;
  const posZ = isPower ? 0.2 : 0.1;
  mesh.position.set(posX, posY, posZ);
  scene.add(mesh);

  const points = isPower ? PacmanBalance.POWER_PELLET_POINTS : PacmanBalance.DOT_POINTS;

  const entity = world.createEntity(`${isPower ? 'Power' : 'Dot'}_${gridX}_${gridY}`);
  world.addComponent(entity, new TransformComponent(posX, posY, posZ));
  world.addComponent(entity, new SpriteComponent({ mesh }));
  world.addComponent(entity, new PelletComponent(type, points, gridX, gridY));
  world.addComponent(entity, new ColliderComponent({
    type: 'circle',
    radius: isPower ? 0.35 : 0.15,
    layer: CollisionLayer.POWERUP,
    mask: CollisionLayer.PLAYER,
  }));

  return entity;
}
