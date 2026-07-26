import { test, expect } from '@playwright/test';
import { clearSmoke, getUnlockedMechanics, applyGravityCollapse, applyHardeningToBoard, HardeningMechanic } from '../../src/components/hardeningEngine';
import { TileState } from '../../src/components/MahjongTile';

test.describe('hardeningEngine - getUnlockedMechanics', () => {
    test('should return empty array for level below first threshold', () => {
        expect(getUnlockedMechanics(3)).toEqual([]);
    });

    test('should return mechanics up to the current level', () => {
        expect(getUnlockedMechanics(4)).toEqual(['mirror']);
        expect(getUnlockedMechanics(15)).toEqual(['mirror']);
        expect(getUnlockedMechanics(16)).toEqual(['mirror', 'ghost']);
        expect(getUnlockedMechanics(40)).toEqual(['mirror', 'ghost', 'padlock']);
    });

    test('should return all mechanics at maximum level threshold', () => {
        const allMechanics = ['mirror', 'ghost', 'padlock', 'ice', 'bomb', 'smoke', 'gravity'];
        expect(getUnlockedMechanics(91)).toEqual(allMechanics);
        expect(getUnlockedMechanics(999)).toEqual(allMechanics);
    });
});

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

test.describe('hardeningEngine - applyGravityCollapse', () => {
    test('should not drop tiles that have support below', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 0, content: { type: 'traditional', value: '1' }, isMatched: false, isSelected: false },
            { id: '2', x: 0, y: 0, z: 1, content: { type: 'traditional', value: '2' }, isMatched: false, isSelected: false }
        ];

        const result = applyGravityCollapse(tiles);
        expect(result[0].z).toBe(0);
        expect(result[1].z).toBe(1);
    });

    test('should drop tiles exactly 1 z-level if below is empty and z=0 has support', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 0, content: { type: 'traditional', value: '1' }, isMatched: false, isSelected: false },
            { id: '2', x: 0, y: 0, z: 2, content: { type: 'traditional', value: '2' }, isMatched: false, isSelected: false }
        ];

        const result = applyGravityCollapse(tiles);
        expect(result[1].z).toBe(1); // dropped from 2 to 1
    });

    test('should drop tiles multiple z-levels until stable (hitting z=0)', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 3, content: { type: 'traditional', value: '1' }, isMatched: false, isSelected: false }
        ];

        const result = applyGravityCollapse(tiles);
        expect(result[0].z).toBe(0); // drops from 3 to 0
    });

    test('should treat matched tiles as non-support and allow tiles above to drop', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 0, content: { type: 'traditional', value: '1' }, isMatched: true, isSelected: false },
            { id: '2', x: 0, y: 0, z: 1, content: { type: 'traditional', value: '2' }, isMatched: false, isSelected: false }
        ];

        const result = applyGravityCollapse(tiles);
        expect(result[1].z).toBe(0);
        // matched tile should not change its z
        expect(result[0].z).toBe(0);
    });

    test('should not drop matched tiles even if they have no support', () => {
        const tiles: TileState[] = [
            { id: '1', x: 0, y: 0, z: 2, content: { type: 'traditional', value: '1' }, isMatched: true, isSelected: false }
        ];

        const result = applyGravityCollapse(tiles);
        expect(result[0].z).toBe(2); // remains 2 because it's matched
    });
});

test.describe('hardeningEngine - applyHardeningToBoard', () => {
    let originalRandom: typeof Math.random;

    test.beforeAll(() => {
        originalRandom = Math.random;
        // Mock random to be deterministic.
        // Returning 0 ensures chance-based mechanics trigger predictably,
        // and shuffle operations sort predictably.
        Math.random = () => 0;
    });

    test.afterAll(() => {
        Math.random = originalRandom;
    });

    const createMockTiles = (): TileState[] => {
        return Array.from({ length: 10 }, (_, i) => ({
            id: `tile_${i}`,
            x: i % 5,
            y: Math.floor(i / 5),
            z: 0,
            content: { type: 'traditional', value: `val_${i % 2}` }, // Creates pairs: 5 of val_0, 5 of val_1
            isMatched: false,
            isSelected: false
        }));
    };

    test('should return cloned array when no active mechanics', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, [], 1);

        expect(result).not.toBe(tiles); // Must be a clone
        expect(result).toEqual(tiles); // Content should be identical
    });

    test('should apply mirror mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['mirror'], 5);
        expect(result.some(t => t.isMirrored)).toBe(true);
    });

    test('should apply ghost mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['ghost'], 20);
        expect(result.some(t => t.isGhost)).toBe(true);
    });

    test('should apply padlock mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['padlock'], 35);

        const locked = result.filter(t => t.isLocked);
        const keys = result.filter(t => t.lockId && !t.isLocked);

        expect(locked.length).toBe(2); // One pair locked
        expect(keys.length).toBe(2);   // One pair acts as keys
        expect(locked[0].lockId).toBe('lock_0');
        expect(keys[0].lockId).toBe('key_0');
    });

    test('should apply ice mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['ice'], 50);
        expect(result.some(t => t.iceCounter === 2)).toBe(true);
    });

    test('should apply bomb mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['bomb'], 65);

        const bombs = result.filter(t => t.isBomb);
        expect(bombs.length).toBe(1);
        expect(bombs[0].bombTimer).toBe(30);
    });

    test('should apply smoke mechanic', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['smoke'], 80);

        const smoked = result.filter(t => t.isSmoked);
        expect(smoked.length).toBeGreaterThan(0);
    });

    test('should apply multiple mechanics compositely', () => {
        const tiles = createMockTiles();
        const result = applyHardeningToBoard(tiles, ['mirror', 'ghost'], 20);

        expect(result.some(t => t.isMirrored)).toBe(true);
        expect(result.some(t => t.isGhost)).toBe(true);
    });
});
