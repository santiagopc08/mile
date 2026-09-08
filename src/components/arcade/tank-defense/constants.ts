import { Direction } from './types';

export const MAP_COLS = 19;
export const MAP_ROWS = 19;
export const TILE_SIZE = 34; // 646 x 646
export const V_WIDTH = 680;
export const V_HEIGHT = 740;
export const BOARD_X = (V_WIDTH - MAP_COLS * TILE_SIZE) / 2; // 17
export const BOARD_Y = 55;

export const DIR_VECTORS: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
};
