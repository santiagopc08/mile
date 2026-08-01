import * as THREE from 'three';
import { createWallEntity } from './entities/Wall.js';
import { createPortalEntity } from './entities/Portal.js';
import { createSpawnPointEntity } from './entities/SpawnPoint.js';
import { createPacmanEntity } from './entities/Pacman.js';
import { createGhostEntity } from './entities/Ghost.js';
import { createPelletEntity } from './entities/Pellet.js';
import { PacmanConfig } from './PacmanConfig.js';
import { TileType, PelletType } from './PacmanConstants.js';

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

    // 1. Instantiate Maze Walls, Pellets & Structural Elements
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const tile = row[c];

        if (tile === TileType.WALL) {
          createWallEntity(world, scene, c, r, wallMaterial, wallGeo);
        } else if (tile === TileType.PELLET_SPAWN) {
          createPelletEntity(world, scene, c, r, PelletType.DOT);
        } else if (tile === TileType.POWER_PELLET_SPAWN) {
          createPelletEntity(world, scene, c, r, PelletType.POWER);
        }
      }
    }

    // 2. Instantiate Portals
    if (mapData.portals) {
      mapData.portals.forEach((p, idx) => {
        createPortalEntity(world, scene, `Left_${idx}`, p.left.x, p.left.y);
        createPortalEntity(world, scene, `Right_${idx}`, p.right.x, p.right.y);
      });
    }

    // 3. Instantiate Spawn Points
    if (mapData.pacmanSpawn) {
      createSpawnPointEntity(world, 'Pacman', mapData.pacmanSpawn.x, mapData.pacmanSpawn.y);
      createPacmanEntity(world, scene, mapData.pacmanSpawn.x, mapData.pacmanSpawn.y);
    }

    if (mapData.ghostSpawns) {
      mapData.ghostSpawns.forEach((g) => {
        createSpawnPointEntity(world, `Ghost_${g.type}`, g.x, g.y);
        createGhostEntity(world, scene, g.type, g.x, g.y);
      });
    }
  }
}
