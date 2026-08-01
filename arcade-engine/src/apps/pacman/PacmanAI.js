import { GhostState, GhostType, Direction } from './PacmanEvents.js';

export class PacmanAI {
  /**
   * Compute the target tile for a ghost based on its type and current state.
   */
  static calculateTargetTile(ghostBehavior, perception, maze) {
    const { ghostType, state, scatterCorner, homeTile } = ghostBehavior;
    const pacX = perception.perceivedPacmanPos.x;
    const pacY = perception.perceivedPacmanPos.y;
    const pacDir = perception.perceivedPacmanDir || Direction.LEFT;

    if (state === GhostState.RESPAWNING) {
      return homeTile;
    }

    if (state === GhostState.SCATTER) {
      return scatterCorner;
    }

    if (state === GhostState.FRIGHTENED) {
      // Target is not used in Frightened mode (movement picks random valid neighbor)
      return { x: 0, y: 0 };
    }

    // CHASE mode — personality-specific target calculation
    switch (ghostType) {
      case GhostType.BLINKY:
        // Blinky targets Pac-Man's exact cell directly
        return { x: pacX, y: pacY };

      case GhostType.PINKY:
        // Pinky targets 4 cells ahead of Pac-Man in facing direction
        return {
          x: pacX + (pacDir.dx || 0) * 4,
          y: pacY + (pacDir.dy || 0) * 4,
        };

      case GhostType.INKY: {
        // Inky uses vector from Blinky to 2 cells ahead of Pac-Man, doubled
        const pivotX = pacX + (pacDir.dx || 0) * 2;
        const pivotY = pacY + (pacDir.dy || 0) * 2;
        const blinkyX = perception.perceivedBlinkyPos.x;
        const blinkyY = perception.perceivedBlinkyPos.y;

        const vecX = pivotX - blinkyX;
        const vecY = pivotY - blinkyY;

        return {
          x: blinkyX + vecX * 2,
          y: blinkyY + vecY * 2,
        };
      }

      case GhostType.CLYDE: {
        // Clyde targets Pac-Man if distance > 8 tiles, otherwise retreats to scatter corner
        const ghostX = ghostBehavior.owner ? ghostBehavior.owner.gridX : 0;
        const ghostY = ghostBehavior.owner ? ghostBehavior.owner.gridY : 0;
        const dist = Math.hypot(pacX - ghostX, pacY - ghostY);

        if (dist > 8) {
          return { x: pacX, y: pacY };
        } else {
          return scatterCorner;
        }
      }

      default:
        return { x: pacX, y: pacY };
    }
  }

  /**
   * Select the next direction at an intersection that minimizes distance to target.
   * Prevents 180-degree turnarounds unless in Frightened mode.
   */
  static selectBestDirection(currentPos, currentDir, targetTile, maze, allowReverse = false, isFrightened = false) {
    const opposites = {
      UP: Direction.DOWN,
      DOWN: Direction.UP,
      LEFT: Direction.RIGHT,
      RIGHT: Direction.LEFT,
    };

    const oppositeDir = currentDir.name ? opposites[currentDir.name] : Direction.NONE;
    const candidates = maze.getNeighbors(currentPos.x, currentPos.y, true);

    // Filter out reverse direction unless allowed
    const valid = candidates.filter((c) => {
      if (!allowReverse && oppositeDir && c.dir.name === oppositeDir.name && candidates.length > 1) {
        return false;
      }
      return true;
    });

    if (valid.length === 0) return currentDir;

    if (isFrightened) {
      // Pick a random valid direction in Frightened mode
      const chosen = valid[Math.floor(Math.random() * valid.length)];
      return chosen.dir;
    }

    // Pick direction that minimizes Euclidean distance to target tile
    let bestDir = valid[0].dir;
    let bestDist = Infinity;

    for (const cand of valid) {
      const dist = Math.hypot(cand.x - targetTile.x, cand.y - targetTile.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = cand.dir;
      }
    }

    return bestDir;
  }
}
