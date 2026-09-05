export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 30;
export const V_WIDTH = 680;
export const V_HEIGHT = 740;
export const BOARD_X = (V_WIDTH - COLS * CELL_SIZE) / 2; // 190
export const BOARD_Y = 70;

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Piece {
    type: TetrominoType;
    rot: number; // 0, 1, 2, 3
    x: number;
    y: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    alpha: number;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
    I: '#00f0ff', // Cyan
    J: '#3b82f6', // Blue
    L: '#f59e0b', // Amber
    O: '#facc15', // Yellow
    S: '#22c55e', // Green
    T: '#a855f7', // Purple
    Z: '#ef4444', // Red
};

export function getPieceOffsets(type: TetrominoType, rot: number): [number, number][] {
    const r = ((rot % 4) + 4) % 4;
    switch (type) {
        case 'I':
            if (r === 0) return [[0, 1], [1, 1], [2, 1], [3, 1]];
            if (r === 1) return [[2, 0], [2, 1], [2, 2], [2, 3]];
            if (r === 2) return [[0, 2], [1, 2], [2, 2], [3, 2]];
            return [[1, 0], [1, 1], [1, 2], [1, 3]];
        case 'J':
            if (r === 0) return [[0, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [2, 0], [1, 1], [1, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [2, 2]];
            return [[1, 0], [1, 1], [0, 2], [1, 2]];
        case 'L':
            if (r === 0) return [[2, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [1, 1], [1, 2], [2, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [0, 2]];
            return [[0, 0], [1, 0], [1, 1], [1, 2]];
        case 'O':
            return [[1, 0], [2, 0], [1, 1], [2, 1]];
        case 'S':
            if (r === 0 || r === 2) return [[1, 0], [2, 0], [0, 1], [1, 1]];
            return [[1, 0], [1, 1], [2, 1], [2, 2]];
        case 'T':
            if (r === 0) return [[1, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [1, 1], [2, 1], [1, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [1, 2]];
            return [[1, 0], [0, 1], [1, 1], [1, 2]];
        case 'Z':
            if (r === 0 || r === 2) return [[0, 0], [1, 0], [1, 1], [2, 1]];
            return [[2, 0], [1, 1], [2, 1], [1, 2]];
    }
}
