import { test, expect } from '@playwright/test';
import { clearSmoke } from '../../src/components/hardeningEngine';
import { TileState } from '../../src/components/MahjongTile';

test.describe('hardeningEngine - clearSmoke', () => {
    test('should set isSmoked to false for all smoked tiles and not mutate originals', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 0, content: { type: 'traditional', value: '1' }, isMatched: false, isSelected: false, isSmoked: true },
            { id: '2', x: 1, y: 0, z: 0, content: { type: 'traditional', value: '2' }, isMatched: false, isSelected: false, isSmoked: false },
            { id: '3', x: 2, y: 0, z: 0, content: { type: 'traditional', value: '3' }, isMatched: false, isSelected: false }
        ];

        const result = clearSmoke(tiles);

        expect(result).toHaveLength(3);
        expect(result[0].isSmoked).toBe(false);
        expect(result[1].isSmoked).toBe(false);
        expect(result[2].isSmoked).toBeUndefined();

        // Verify original array is unchanged
        expect(tiles[0].isSmoked).toBe(true);
        expect(tiles[1].isSmoked).toBe(false);
        expect(tiles[2].isSmoked).toBeUndefined();

        // Verify references are kept for unchanged tiles
        expect(result[1]).toBe(tiles[1]);
        expect(result[2]).toBe(tiles[2]);
    });
});
