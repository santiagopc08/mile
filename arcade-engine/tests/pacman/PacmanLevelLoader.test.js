import { describe, it, expect, beforeEach } from 'vitest';

import { World } from '../../src/engine/ecs/World.js';
import { PacmanLevelLoader } from '../../src/pacman/PacmanLevelLoader.js';
import { PacmanGridComponent } from '../../src/pacman/components/PacmanGridComponent.js';
import { GhostAIComponent } from '../../src/pacman/components/GhostAIComponent.js';
import { PelletComponent } from '../../src/pacman/components/PelletComponent.js';
import { PelletType } from '../../src/pacman/PacmanConstants.js';
import mapData from '../../src/pacman/assets/maps/classic.json';

function makeEngine() {
  const world = new World();
  return {
    world,
    rendererManager: { scene: { add() {}, remove() {} } },
  };
}

function countTiles(matrix, tile) {
  let total = 0;
  for (const row of matrix) {
    for (const cell of row) if (cell === tile) total += 1;
  }
  return total;
}

describe('PacmanLevelLoader sobre el mapa clásico', () => {
  let engine;
  let world;

  beforeEach(() => {
    engine = makeEngine();
    world = engine.world;
    new PacmanLevelLoader(engine).loadLevel(mapData);
  });

  const query = (componentClass) =>
    world.getEntitiesForQuery(world.createQuery([componentClass]));

  it('instancia un pellet por cada tile de pellet del mapa', () => {
    const expected =
      countTiles(mapData.matrix, '2') + countTiles(mapData.matrix, '3');

    expect(expected).toBeGreaterThan(0);
    expect(query(PelletComponent).length).toBe(expected);
  });

  it('distingue dots de power pellets', () => {
    const pellets = query(PelletComponent).map((e) =>
      world.getComponent(e, PelletComponent)
    );

    const powers = pellets.filter((p) => p.type === PelletType.POWER);
    expect(powers.length).toBe(countTiles(mapData.matrix, '3'));
    for (const power of powers) {
      expect(power.points).toBeGreaterThan(pellets[0].points);
    }
  });

  it('da a Pac-Man su componente de grid para que el sistema de movimiento lo vea', () => {
    // Sin esto el juego arranca con Pac-Man inmóvil y sin errores en consola.
    expect(query(PacmanGridComponent).length).toBe(1);
  });

  it('da a cada fantasma su componente de IA', () => {
    expect(query(GhostAIComponent).length).toBe(mapData.ghostSpawns.length);
  });

  it('coloca las entidades en las coordenadas de spawn declaradas', () => {
    const pacmanEntity = query(PacmanGridComponent)[0];
    const grid = world.getComponent(pacmanEntity, PacmanGridComponent);

    expect(grid.gridX).toBe(mapData.pacmanSpawn.x);
    expect(grid.gridY).toBe(mapData.pacmanSpawn.y);
  });

  it('no completa el nivel en el primer frame', () => {
    // PacmanGameRulesSystem emite LEVEL_COMPLETED cuando no quedan pellets.
    // Cargar un nivel sin pellets lo dispara en bucle desde el frame 1.
    expect(query(PelletComponent).length).toBeGreaterThan(0);
  });
});
