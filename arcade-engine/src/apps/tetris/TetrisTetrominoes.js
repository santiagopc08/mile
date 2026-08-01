import { TetrominoType } from './TetrisEvents.js';

export const TETROMINO_SHAPES = Object.freeze({
  [TetrominoType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [TetrominoType.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.O]: [
    [1, 1],
    [1, 1],
  ],
  [TetrominoType.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [TetrominoType.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
});

export const TETROMINO_COLORS = Object.freeze({
  [TetrominoType.I]: '#00f0f0', // Cyan
  [TetrominoType.J]: '#0000f0', // Blue
  [TetrominoType.L]: '#f0a000', // Orange
  [TetrominoType.O]: '#f0f000', // Yellow
  [TetrominoType.S]: '#00f000', // Green
  [TetrominoType.T]: '#a000f0', // Purple
  [TetrominoType.Z]: '#f00000', // Red
});

export class TetrominoUtils {
  /**
   * Rotate a square matrix 90 degrees clockwise.
   */
  static rotateClockwise(matrix) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  /**
   * Rotate a square matrix 90 degrees counter-clockwise.
   */
  static rotateCounterClockwise(matrix) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[N - 1 - c][r] = matrix[r][c];
      }
    }
    return result;
  }

  /**
   * Return a random TetrominoType.
   */
  static getRandomType() {
    const types = Object.values(TetrominoType);
    return types[Math.floor(Math.random() * types.length)];
  }
}
