import * as THREE from 'three';
import { TransformComponent } from '../components/TransformComponent.js';
import { SpriteComponent } from '../components/SpriteComponent.js';
import { ColliderComponent, CollisionLayer } from '../components/ColliderComponent.js';
import { PacmanGridComponent } from './components/PacmanGridComponent.js';
import { GhostAIComponent } from './components/GhostAIComponent.js';
import { PelletComponent } from './components/PelletComponent.js';
import { PelletType, GhostType } from './PacmanConstants.js';
import { PacmanConfig } from './PacmanConfig.js';

export class PacmanLevelLoader {
  /**
   * @param {import('../engine/ArcadeEngine.js').ArcadeEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
  }

  loadLevel(mapData) {
    const world = this.engine.world;
    const scene = this.engine.rendererManager.scene;
    const matrix = mapData.matrix;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2121ff,
      roughness: 0.2,
      metalness: 0.5,
    });
    const wallGeo = new THREE.BoxGeometry(PacmanConfig.GRID_SIZE, PacmanConfig.GRID_SIZE, 0.8);

    const dotMaterial = new THREE.MeshStandardMaterial({ color: 0xffb8ae, roughness: 0.1 });
    const dotGeo = new THREE.SphereGeometry(0.12, 8, 8);

    const powerMaterial = new THREE.MeshStandardMaterial({ color: 0xffb8ae, emissive: 0xff8866 });
    const powerGeo = new THREE.SphereGeometry(0.3, 12, 12);

    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const tile = row[c];
        const posX = PacmanConfig.ORIGIN_X + c * PacmanConfig.GRID_SIZE;
        const posY = PacmanConfig.ORIGIN_Y - r * PacmanConfig.GRID_SIZE;

        if (tile === '1') {
          // Maze Wall
          const mesh = new THREE.Mesh(wallGeo, wallMaterial);
          mesh.position.set(posX, posY, 0.4);
          mesh.castShadow = true;
          scene.add(mesh);

          const wall = world.createEntity(`Wall_${c}_${r}`);
          world.addComponent(wall, new TransformComponent(posX, posY, 0.4));
          world.addComponent(wall, new SpriteComponent({ mesh }));
          world.addComponent(wall, new ColliderComponent({
            type: 'aabb',
            width: PacmanConfig.GRID_SIZE,
            height: PacmanConfig.GRID_SIZE,
            layer: CollisionLayer.WALL,
          }));
        } else if (tile === '2') {
          // Pellet Dot
          const mesh = new THREE.Mesh(dotGeo, dotMaterial);
          mesh.position.set(posX, posY, 0.1);
          scene.add(mesh);

          const dot = world.createEntity(`Dot_${c}_${r}`);
          world.addComponent(dot, new TransformComponent(posX, posY, 0.1));
          world.addComponent(dot, new SpriteComponent({ mesh }));
          world.addComponent(dot, new PelletComponent(PelletType.DOT, PacmanConfig.DOT_POINTS, c, r));
          world.addComponent(dot, new ColliderComponent({
            type: 'circle',
            radius: 0.15,
            layer: CollisionLayer.POWERUP,
            mask: CollisionLayer.PLAYER,
          }));
        } else if (tile === '3') {
          // Power Pellet
          const mesh = new THREE.Mesh(powerGeo, powerMaterial);
          mesh.position.set(posX, posY, 0.2);
          scene.add(mesh);

          const power = world.createEntity(`Power_${c}_${r}`);
          world.addComponent(power, new TransformComponent(posX, posY, 0.2));
          world.addComponent(power, new SpriteComponent({ mesh }));
          world.addComponent(power, new PelletComponent(PelletType.POWER, PacmanConfig.POWER_PELLET_POINTS, c, r));
          world.addComponent(power, new ColliderComponent({
            type: 'circle',
            radius: 0.35,
            layer: CollisionLayer.POWERUP,
            mask: CollisionLayer.PLAYER,
          }));
        }
      }
    }

    // Spawn Pac-Man Entity
    this._spawnPacman(mapData.pacmanSpawn, scene, world);

    // Spawn 4 Ghost Entities (Blinky, Pinky, Inky, Clyde)
    this._spawnGhosts(mapData.ghostSpawns, scene, world);
  }

  _spawnPacman(spawn, scene, world) {
    const geo = new THREE.SphereGeometry(0.5, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x444400,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const posX = PacmanConfig.ORIGIN_X + spawn.x * PacmanConfig.GRID_SIZE;
    const posY = PacmanConfig.ORIGIN_Y - spawn.y * PacmanConfig.GRID_SIZE;
    mesh.position.set(posX, posY, 0.5);
    scene.add(mesh);

    const pacman = world.createEntity('Pacman');
    world.addComponent(pacman, new TransformComponent(posX, posY, 0.5));
    world.addComponent(pacman, new SpriteComponent({ mesh }));
    world.addComponent(pacman, new PacmanGridComponent(spawn.x, spawn.y));
    world.addComponent(pacman, new ColliderComponent({
      type: 'circle',
      radius: 0.5,
      layer: CollisionLayer.PLAYER,
      mask: CollisionLayer.POWERUP | CollisionLayer.ENEMY | CollisionLayer.WALL,
    }));
  }

  _spawnGhosts(spawns, scene, world) {
    const ghostConfigs = [
      { type: GhostType.BLINKY, color: 0xff0000, spawn: spawns.BLINKY },
      { type: GhostType.PINKY,  color: 0xffb8ff, spawn: spawns.PINKY },
      { type: GhostType.INKY,   color: 0x00ffff, spawn: spawns.INKY },
      { type: GhostType.CLYDE,  color: 0xffb852, spawn: spawns.CLYDE },
    ];

    ghostConfigs.forEach((cfg) => {
      const geo = new THREE.CapsuleGeometry(0.4, 0.3, 8, 16);
      const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      const posX = PacmanConfig.ORIGIN_X + cfg.spawn.x * PacmanConfig.GRID_SIZE;
      const posY = PacmanConfig.ORIGIN_Y - cfg.spawn.y * PacmanConfig.GRID_SIZE;
      mesh.position.set(posX, posY, 0.5);
      scene.add(mesh);

      const ghost = world.createEntity(`Ghost_${cfg.type}`);
      world.addComponent(ghost, new TransformComponent(posX, posY, 0.5));
      world.addComponent(ghost, new SpriteComponent({ mesh }));
      world.addComponent(ghost, new GhostAIComponent(cfg.type, cfg.spawn.x, cfg.spawn.y));
      world.addComponent(ghost, new ColliderComponent({
        type: 'circle',
        radius: 0.45,
        layer: CollisionLayer.ENEMY,
        mask: CollisionLayer.PLAYER,
      }));
    });
  }
}
