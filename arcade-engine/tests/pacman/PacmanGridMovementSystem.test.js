import { describe, it, expect, beforeEach } from 'vitest';

import { World } from '../../src/engine/ecs/World.js';
import { TransformComponent } from '../../src/components/TransformComponent.js';
import { PacmanGridComponent } from '../../src/pacman/components/PacmanGridComponent.js';
import { PacmanGridMovementSystem } from '../../src/pacman/systems/PacmanGridMovementSystem.js';
import { PacmanBalance } from '../../src/pacman/PacmanBalance.js';
import { Direction } from '../../src/pacman/PacmanConstants.js';

/**
 * Mapa mínimo: un corredor horizontal abierto en la fila 1, rodeado de muros.
 *   fila 0: # # # # #
 *   fila 1: # . . . #
 *   fila 2: # # # # #
 */
const CORRIDOR = [
  ['1', '1', '1', '1', '1'],
  ['1', '0', '0', '0', '1'],
  ['1', '1', '1', '1', '1'],
];

function makeActiveInput(action) {
  return { isActionActive: (name) => name === action };
}

function setup(mapMatrix = CORRIDOR, action = null) {
  const world = new World();
  world.engine = { inputManager: makeActiveInput(action) };

  const system = new PacmanGridMovementSystem(mapMatrix);
  world.systems.push(system);
  system.init(world);

  const pacman = world.createEntity('Pacman');
  world.addComponent(pacman, new TransformComponent(0, 0, 0));
  world.addComponent(pacman, new PacmanGridComponent(1, 1));

  return { world, system, pacman };
}

describe('PacmanGridMovementSystem', () => {
  let ctx;

  beforeEach(() => {
    ctx = setup(CORRIDOR, 'MOVE_RIGHT');
  });

  it('nunca produce NaN en la posición ni en el progreso', () => {
    const grid = ctx.world.getComponent(ctx.pacman, PacmanGridComponent);
    const transform = ctx.world.getComponent(ctx.pacman, TransformComponent);

    for (let i = 0; i < 60; i++) {
      ctx.system.fixedUpdate(1 / 60);
    }

    expect(Number.isNaN(grid.progress)).toBe(false);
    expect(Number.isNaN(transform.position.x)).toBe(false);
    expect(Number.isNaN(transform.position.y)).toBe(false);
  });

  it('avanza exactamente un tile tras 1/PACMAN_SPEED segundos', () => {
    const grid = ctx.world.getComponent(ctx.pacman, PacmanGridComponent);
    const startX = grid.gridX;

    const fixedDt = 1 / 240;
    const stepsPerTile = Math.ceil(1 / (PacmanBalance.PACMAN_SPEED * fixedDt));
    for (let i = 0; i < stepsPerTile; i++) {
      ctx.system.fixedUpdate(fixedDt);
    }

    expect(grid.currentDirection).toBe(Direction.RIGHT);
    expect(grid.gridX).toBe(startX + 1);
  });

  it('mueve la posición del transform respecto a su valor inicial', () => {
    const transform = ctx.world.getComponent(ctx.pacman, TransformComponent);

    ctx.system.fixedUpdate(1 / 60);
    const afterFirst = transform.position.x;

    for (let i = 0; i < 10; i++) {
      ctx.system.fixedUpdate(1 / 60);
    }

    expect(transform.position.x).toBeGreaterThan(afterFirst);
  });

  it('se detiene contra un muro sin acumular progreso', () => {
    // Corredor de un solo tile: cualquier movimiento choca inmediatamente.
    const blocked = setup([
      ['1', '1', '1'],
      ['1', '0', '1'],
      ['1', '1', '1'],
    ], 'MOVE_RIGHT');

    const grid = blocked.world.getComponent(blocked.pacman, PacmanGridComponent);

    for (let i = 0; i < 60; i++) {
      blocked.system.fixedUpdate(1 / 60);
    }

    expect(grid.gridX).toBe(1);
    expect(grid.progress).toBe(0);
  });
});
