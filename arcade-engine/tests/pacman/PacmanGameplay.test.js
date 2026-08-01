import { describe, it, expect, beforeEach } from 'vitest';

import { World } from '../../src/engine/ecs/World.js';
import { EventBus } from '../../src/engine/core/EventBus.js';
import { PacmanLevelLoader } from '../../src/pacman/PacmanLevelLoader.js';
import { PacmanGridMovementSystem } from '../../src/pacman/systems/PacmanGridMovementSystem.js';
import { PacmanCollisionSystem } from '../../src/pacman/systems/PacmanCollisionSystem.js';
import { PacmanGridComponent } from '../../src/pacman/components/PacmanGridComponent.js';
import { PelletComponent } from '../../src/pacman/components/PelletComponent.js';
import { PacmanEvents } from '../../src/pacman/PacmanEvents.js';
import { Direction } from '../../src/pacman/PacmanConstants.js';
import mapData from '../../src/pacman/assets/maps/classic.json';

/**
 * Doble del engine con la misma superficie que consumen los sistemas de
 * gameplay. Se construye el World con `new World(engine)` igual que
 * ArcadeEngine: varios sistemas hacen `return` en silencio si world.engine
 * falta, así que la ausencia de esa referencia no produce ningún error visible,
 * sólo un juego inerte.
 */
function makeHarness(heldActions = []) {
  const eventBus = new EventBus();
  const engine = {
    eventBus,
    uiBridge: { state: { score: 0, lives: 3 }, setState(patch) { Object.assign(this.state, patch); } },
    inputManager: { isActionActive: (name) => heldActions.includes(name) },
    audioManager: { playSFX() {} },
    cameraManager: { shake() {} },
    rendererManager: { scene: { add() {}, remove() {} } },
  };

  const world = new World(engine);
  engine.world = world;

  eventBus.on(PacmanEvents.SCORE_CHANGED, (score) => {
    engine.uiBridge.state.score = score;
  });

  new PacmanLevelLoader(engine).loadLevel(mapData);

  const movement = new PacmanGridMovementSystem(mapData.matrix);
  const collision = new PacmanCollisionSystem();
  world.addSystem(movement);
  world.addSystem(collision);

  return { engine, world, heldActions, tick: (n = 1) => {
    for (let i = 0; i < n; i++) world.fixedUpdate(1 / 60);
  }};
}

function pacmanGrid(world) {
  for (const [id, entity] of world.entities) {
    if (entity.name === 'Pacman') {
      return [...world.entityComponents.get(id).values()]
        .find((c) => c instanceof PacmanGridComponent);
    }
  }
  return null;
}

function countPellets(world) {
  return world.getEntitiesForQuery(world.createQuery([PelletComponent])).length;
}

describe('gameplay de Pac-Man de extremo a extremo', () => {
  let h;

  beforeEach(() => {
    h = makeHarness(['MOVE_LEFT']);
  });

  it('el world expone el engine a los sistemas', () => {
    // Sin esto el movimiento, las colisiones y las reglas salen en silencio.
    expect(h.world.engine).toBe(h.engine);
  });

  it('Pac-Man responde al input y cambia de dirección', () => {
    const grid = pacmanGrid(h.world);
    expect(grid.currentDirection).toBe(Direction.NONE);

    h.tick(2);

    expect(grid.currentDirection).toBe(Direction.LEFT);
  });

  it('Pac-Man avanza por el laberinto', () => {
    const grid = pacmanGrid(h.world);
    const inicio = grid.gridX;

    h.tick(120);

    expect(grid.gridX).toBeLessThan(inicio);
    expect(Number.isNaN(grid.gridX)).toBe(false);
  });

  it('comer pellets reduce el conteo y suma puntos', () => {
    const pelletsIniciales = countPellets(h.world);
    expect(pelletsIniciales).toBeGreaterThan(200);

    h.tick(240);

    expect(countPellets(h.world)).toBeLessThan(pelletsIniciales);
    expect(h.engine.uiBridge.state.score).toBeGreaterThan(0);
  });

  it('el score nunca se vuelve NaN', () => {
    h.tick(240);
    expect(Number.isNaN(h.engine.uiBridge.state.score)).toBe(false);
  });

  it('sin input Pac-Man se queda quieto', () => {
    const quieto = makeHarness([]);
    const grid = pacmanGrid(quieto.world);
    const inicio = { x: grid.gridX, y: grid.gridY };

    quieto.tick(120);

    expect({ x: grid.gridX, y: grid.gridY }).toEqual(inicio);
  });
});
