import { useMemo } from 'react';
import { TileState } from '../../MahjongTile';

export function useBoardBounds(tiles: TileState[], isMobile: boolean) {
    return useMemo(() => {
        if (tiles.length === 0) {
            return {
                centerX: 9,
                centerY: 7,
                boardWidth: 11.2,
                boardHeight: 12.0,
                boardY: -0.6,
                dockY: 4.8
            };
        }

        // ⚡ Bolt Optimization: Single O(N) pass for boundary detection
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const t of tiles) {
            if (t.x < minX) minX = t.x;
            if (t.x > maxX) maxX = t.x;
            if (t.y < minY) minY = t.y;
            if (t.y > maxY) maxY = t.y;
        }

        const spacingX = 0.43;
        const spacingY = 0.59;
        const tileWidth = 0.82;
        const tileHeight = 1.16;

        // Use fixed bounds of 14 columns (width) and 14 rows (height) to keep camera zoom and dock positioning constant across all layouts (strictly 8x8)
        const fixedCols = 14;
        const fixedRows = 14;

        const width = fixedCols * spacingX + tileWidth;
        const height = fixedRows * spacingY + tileHeight;

        // Espacio libre físico constante entre el tablero y el dock (reducido en móvil para ganar espacio y zoom)
        const gap = isMobile ? 0.42 : 0.78;
        const totalHeight = height + gap + tileHeight;

        // Centrado de la altura combinada sobre Y = 0
        const dockY = (totalHeight - tileHeight) / 2;
        const boardY = -(totalHeight - height) / 2;

        return {
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            boardWidth: width,
            boardHeight: totalHeight,
            boardY,
            dockY
        };
    }, [tiles, isMobile]);
}
