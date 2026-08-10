import { TileState } from '../../MahjongTile';

export interface DyingInfo {
    id: string;
    start: number;
    collisionPos: [number, number, number];
    isDockTile: boolean;
}

export interface Tile3DProps {
    tile: TileState;
    isFree: boolean;
    centerX: number;
    centerY: number;
    boardY: number;
    dockY: number;
    dockIds: string[];
    onSelect: (id: string) => void;
    isGhostSolid?: boolean;
    hasStarted: boolean;
    dyingInfo?: DyingInfo;
}
