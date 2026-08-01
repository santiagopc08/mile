export class TetrisGrid {
  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    /** @type {(string|null)[][]} 2D occupancy grid: null = empty, string = block color */
    this.cells = Array.from({ length: height }, () => Array(width).fill(null));
  }

  clear() {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        this.cells[r][c] = null;
      }
    }
  }

  isOccupied(x, y) {
    if (x < 0 || x >= this.width || y >= this.height) return true;
    if (y < 0) return false; // Above board is valid space during spawn
    return this.cells[y][x] !== null;
  }

  /**
   * Check whether a shape matrix at (posX, posY) overlaps walls or locked blocks.
   */
  isValidPosition(matrix, posX, posY) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const gx = posX + c;
          const gy = posY + r;
          if (this.isOccupied(gx, gy)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Lock shape blocks into the grid cells.
   */
  lockPiece(matrix, posX, posY, color) {
    const lockedCells = [];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const gx = posX + c;
          const gy = posY + r;
          if (gy >= 0 && gy < this.height && gx >= 0 && gx < this.width) {
            this.cells[gy][gx] = color;
            lockedCells.push({ x: gx, y: gy, color });
          }
        }
      }
    }
    return lockedCells;
  }

  /**
   * Find row indices that are completely filled with blocks.
   */
  findCompletedLines() {
    const completed = [];
    for (let r = 0; r < this.height; r++) {
      if (this.cells[r].every((cell) => cell !== null)) {
        completed.push(r);
      }
    }
    return completed;
  }

  /**
   * Remove completed lines and collapse upper rows downward.
   * Performs structural mutation on the discrete grid.
   */
  clearLines(linesToClear) {
    if (linesToClear.length === 0) return;

    // Filter out rows and append new empty rows at the top
    this.cells = this.cells.filter((_, idx) => !linesToClear.includes(idx));
    while (this.cells.length < this.height) {
      this.cells.unshift(Array(this.width).fill(null));
    }
  }

  /**
   * Compute ghost drop position (hard drop preview position).
   */
  getGhostY(matrix, posX, posY) {
    let ghostY = posY;
    while (this.isValidPosition(matrix, posX, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }
}
