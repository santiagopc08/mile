import { TetrominoUtils } from './TetrisTetrominoes.js';

// ──────────────────────────────────────────
// System: Tetris Input, Rotation & Wall Kick System
// ──────────────────────────────────────────
export class TetrisInputSystem {
  /**
   * @param {import('../../sdk/actors/core/Actor.js').Actor} activePiece
   * @param {import('./TetrisGrid.js').TetrisGrid} grid
   * @returns {{ hardDropped: boolean, pieceLocked: boolean, held: boolean }}
   */
  update(activePiece, grid) {
    if (!activePiece) return { hardDropped: false, pieceLocked: false, held: false };

    const input = activePiece.getComponent('TetrisInputComponent');
    const pos = activePiece.getComponent('GridPositionComponent');
    const tetro = activePiece.getComponent('TetrominoComponent');
    const tc = activePiece.getComponent('TransformComponent');
    const audio = activePiece.getComponent('AudioCueComponent');

    if (!input || !pos || !tetro) return { hardDropped: false, pieceLocked: false, held: false };

    let held = false;
    let hardDropped = false;
    let pieceLocked = false;

    // 1. Hold Piece Request
    if (input.hold) {
      input.hold = false;
      return { hardDropped: false, pieceLocked: false, held: true };
    }

    // 2. Horizontal Movement
    if (input.moveX !== 0) {
      const nextX = pos.gridX + input.moveX;
      if (grid.isValidPosition(tetro.matrix, nextX, pos.gridY)) {
        pos.gridX = nextX;
        if (tc) tc.x = nextX;
        if (audio) audio.play('move');
      }
      input.moveX = 0;
    }

    // 3. Rotation (CW / CCW) with basic wall kicks
    if (input.rotateDir !== 0) {
      const rotated = input.rotateDir > 0
        ? TetrominoUtils.rotateClockwise(tetro.matrix)
        : TetrominoUtils.rotateCounterClockwise(tetro.matrix);

      const kickOffsets = [0, 1, -1, 2, -2]; // Wall kick offsets
      let rotatedValid = false;

      for (const offset of kickOffsets) {
        if (grid.isValidPosition(rotated, pos.gridX + offset, pos.gridY)) {
          pos.gridX += offset;
          if (tc) tc.x = pos.gridX;
          tetro.setShape(rotated);
          rotatedValid = true;
          if (audio) audio.play('rotate');
          break;
        }
      }
      input.rotateDir = 0;
    }

    // 4. Hard Drop
    if (input.hardDrop) {
      input.hardDrop = false;
      const ghostY = grid.getGhostY(tetro.matrix, pos.gridX, pos.gridY);
      pos.gridY = ghostY;
      if (tc) tc.y = ghostY;
      hardDropped = true;
      pieceLocked = true;
      if (audio) audio.play('hard_drop');
    }

    // 5. Soft Drop
    if (input.softDrop) {
      input.softDrop = false;
      if (grid.isValidPosition(tetro.matrix, pos.gridX, pos.gridY + 1)) {
        pos.gridY += 1;
        if (tc) tc.y = pos.gridY;
        if (audio) audio.play('soft_drop');
      }
    }

    return { hardDropped, pieceLocked, held };
  }
}

// ──────────────────────────────────────────
// System: Fall & Gravity System
// ──────────────────────────────────────────
export class FallSystem {
  constructor() {
    this.fallTimer = 0;
  }

  /**
   * Gravity update — advances piece downward every interval.
   * @returns {{ locked: boolean }}
   */
  update(dt, activePiece, grid, level = 1) {
    if (!activePiece) return { locked: false };

    // Speed progression formula: max(0.05, 0.8 - (level - 1) * 0.07)
    const interval = Math.max(0.05, 0.8 - (level - 1) * 0.07);

    this.fallTimer += dt;
    if (this.fallTimer >= interval) {
      this.fallTimer = 0;

      const pos = activePiece.getComponent('GridPositionComponent');
      const tetro = activePiece.getComponent('TetrominoComponent');
      const tc = activePiece.getComponent('TransformComponent');

      if (pos && tetro) {
        if (grid.isValidPosition(tetro.matrix, pos.gridX, pos.gridY + 1)) {
          pos.gridY += 1;
          if (tc) tc.y = pos.gridY;
        } else {
          // Cannot drop further -> Piece must be locked!
          return { locked: true };
        }
      }
    }

    return { locked: false };
  }
}
