import { GhostState, Direction, PacmanEvents } from './PacmanEvents.js';
import { PacmanAI } from './PacmanAI.js';

// ──────────────────────────────────────────
// System: Pac-Man Input & Direction Selection
// ──────────────────────────────────────────
export class PacmanInputSystem {
  update(pacman, maze) {
    const input = pacman.getComponent('PacmanInputComponent');
    const nav = pacman.getComponent('NavigationComponent');
    const pos = pacman.getComponent('GridPositionComponent');
    if (!input || !nav || !pos) return;

    // Check if buffered direction is walkable
    if (input.bufferedDirection && input.bufferedDirection !== Direction.NONE) {
      const nextX = pos.gridX + input.bufferedDirection.dx;
      const nextY = pos.gridY + input.bufferedDirection.dy;

      if (maze.isWalkable(nextX, nextY, false) || maze.isTunnel(nextX, nextY)) {
        nav.currentDirection = input.bufferedDirection;
      }
    }

    // Check if current direction continues to be walkable
    if (nav.currentDirection && nav.currentDirection !== Direction.NONE) {
      const aheadX = pos.gridX + nav.currentDirection.dx;
      const aheadY = pos.gridY + nav.currentDirection.dy;

      if (!maze.isWalkable(aheadX, aheadY, false) && !maze.isTunnel(aheadX, aheadY)) {
        nav.currentDirection = Direction.NONE;
      }
    }
  }
}

// ──────────────────────────────────────────
// System: Discrete Movement (Grid & Tunnel Step)
// ──────────────────────────────────────────
export class DiscreteMovementSystem {
  update(actor, maze) {
    const pos = actor.getComponent('GridPositionComponent');
    const nav = actor.getComponent('NavigationComponent');
    const tc = actor.getComponent('TransformComponent');
    if (!pos || !nav || nav.currentDirection === Direction.NONE) return;

    let nextX = pos.gridX + nav.currentDirection.dx;
    let nextY = pos.gridY + nav.currentDirection.dy;

    // Handle tunnel warp
    if (maze.isTunnel(nextX, nextY)) {
      const warp = maze.getWarpTarget(nextX, nextY);
      nextX = warp.x;
      nextY = warp.y;
    }

    pos.set(nextX, nextY);
    actor.gridX = nextX;
    actor.gridY = nextY;

    if (tc) {
      tc.setPosition(nextX, nextY);
    }
  }
}

// ──────────────────────────────────────────
// System: Ghost AI & Perception System
// ──────────────────────────────────────────
export class GhostAISystem {
  update(ghost, pacman, blinky, maze, globalMode) {
    const behavior = ghost.getComponent('GhostBehaviorComponent');
    const perception = ghost.getComponent('PerceptionComponent');
    const pos = ghost.getComponent('GridPositionComponent');
    const nav = ghost.getComponent('NavigationComponent');
    if (!behavior || !perception || !pos || !nav) return;

    // 1. Sync global mode if not in temporary Frightened or Respawning state
    if (behavior.state !== GhostState.FRIGHTENED && behavior.state !== GhostState.RESPAWNING) {
      behavior.setState(globalMode);
    }

    // 2. Perception update
    const pacPos = pacman.getComponent('GridPositionComponent');
    const pacNav = pacman.getComponent('NavigationComponent');
    if (pacPos) perception.perceivedPacmanPos = { x: pacPos.gridX, y: pacPos.gridY };
    if (pacNav) perception.perceivedPacmanDir = pacNav.currentDirection;

    if (blinky) {
      const blinkyPos = blinky.getComponent('GridPositionComponent');
      if (blinkyPos) perception.perceivedBlinkyPos = { x: blinkyPos.gridX, y: blinkyPos.gridY };
    }

    // 3. Target calculation
    behavior.targetTile = PacmanAI.calculateTargetTile(behavior, perception, maze);

    // 4. Direction selection at current tile
    const isFrightened = behavior.state === GhostState.FRIGHTENED;
    const isRespawning = behavior.state === GhostState.RESPAWNING;

    // Respawning arrival check
    if (isRespawning && pos.gridX === behavior.homeTile.x && pos.gridY === behavior.homeTile.y) {
      behavior.setState(globalMode);
    }

    const nextDir = PacmanAI.selectBestDirection(
      { x: pos.gridX, y: pos.gridY },
      nav.currentDirection,
      behavior.targetTile,
      maze,
      false,
      isFrightened
    );

    nav.currentDirection = nextDir;
  }
}

// ──────────────────────────────────────────
// System: Pellet & Item Collection System
// ──────────────────────────────────────────
export class PelletCollectionSystem {
  /**
   * @param {import('../../sdk/actors/core/Actor.js').Actor} pacman
   * @param {Map<string, import('../../sdk/actors/core/Actor.js').Actor>} pelletsMap
   * @param {import('../../sdk/actors/core/Actor.js').Actor|null} fruit
   * @returns {{ consumedPellet: any, consumedPowerPellet: any, consumedFruit: boolean }}
   */
  update(pacman, pelletsMap, fruit) {
    const pos = pacman.getComponent('GridPositionComponent');
    if (!pos) return { consumedPellet: null, consumedPowerPellet: null, consumedFruit: false };

    const key = `${pos.gridX},${pos.gridY}`;
    let consumedPellet = null;
    let consumedPowerPellet = null;
    let consumedFruit = false;

    if (pelletsMap.has(key)) {
      const item = pelletsMap.get(key);
      pelletsMap.delete(key);

      if (item.isPower) {
        consumedPowerPellet = item;
      } else {
        consumedPellet = item;
      }
    }

    if (fruit && fruit.gridX === pos.gridX && fruit.gridY === pos.gridY) {
      consumedFruit = true;
    }

    return { consumedPellet, consumedPowerPellet, consumedFruit };
  }
}

// ──────────────────────────────────────────
// System: Ghost Collision System
// ──────────────────────────────────────────
export class GhostCollisionSystem {
  /**
   * @returns {{ capturedGhost: any, pacmanDied: boolean }}
   */
  update(pacman, ghosts) {
    const pacPos = pacman.getComponent('GridPositionComponent');
    if (!pacPos) return { capturedGhost: null, pacmanDied: false };

    for (const ghost of ghosts) {
      const ghostPos = ghost.getComponent('GridPositionComponent');
      const behavior = ghost.getComponent('GhostBehaviorComponent');
      if (!ghostPos || !behavior) continue;

      if (ghostPos.gridX === pacPos.gridX && ghostPos.gridY === pacPos.gridY) {
        if (behavior.state === GhostState.FRIGHTENED) {
          behavior.setState(GhostState.RESPAWNING);
          return { capturedGhost: ghost, pacmanDied: false };
        } else if (behavior.state !== GhostState.RESPAWNING) {
          return { capturedGhost: null, pacmanDied: true };
        }
      }
    }

    return { capturedGhost: null, pacmanDied: false };
  }
}
