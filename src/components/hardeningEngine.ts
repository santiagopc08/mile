/**
 * Hardening Engine — Pure logic module for Mahjong hardening mechanics.
 * Each mechanic is activated based on player level and applied during board
 * initialization or dynamically during gameplay via tick/process functions.
 */

import { TileState, TileContent } from './MahjongTile';

// ─── Mechanic Activation ─────────────────────────────────────────────────────

export type HardeningMechanic = 'mirror' | 'ghost' | 'padlock' | 'ice' | 'bomb' | 'smoke' | 'gravity';

const MECHANIC_THRESHOLDS: { mechanic: HardeningMechanic; minLevel: number }[] = [
    { mechanic: 'mirror', minLevel: 4 },
    { mechanic: 'ghost', minLevel: 16 },
    { mechanic: 'padlock', minLevel: 31 },
    { mechanic: 'ice', minLevel: 46 },
    { mechanic: 'bomb', minLevel: 61 },
    { mechanic: 'smoke', minLevel: 76 },
    { mechanic: 'gravity', minLevel: 91 },
];

export function getUnlockedMechanics(level: number): HardeningMechanic[] {
    return MECHANIC_THRESHOLDS
        .filter(t => level >= t.minLevel)
        .map(t => t.mechanic);
}

export function selectActiveMechanicsForGame(level: number): HardeningMechanic[] {
    const unlocked = getUnlockedMechanics(level);
    if (unlocked.length === 0) return [];
    
    // Choose how many mechanics to activate
    // Limit maximum active at once so it's challenging but not unplayable
    let maxActive = 1;
    if (unlocked.length === 2) maxActive = 2;
    else if (unlocked.length === 3) maxActive = 2;
    else if (unlocked.length >= 4) maxActive = 3;
    
    // Random number of active mechanics (at least 1)
    const numActive = Math.floor(Math.random() * maxActive) + 1;
    
    // Shuffle unlocked list to pick a random subset
    const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numActive);
}

// ─── Board Initialization ────────────────────────────────────────────────────

export function applyHardeningToBoard(tiles: TileState[], activeMechanics: HardeningMechanic[], level: number): TileState[] {
    let result = [...tiles.map(t => ({ ...t }))];

    if (activeMechanics.includes('mirror')) {
        result = applyMirror(result, level);
    }
    if (activeMechanics.includes('ghost')) {
        result = applyGhost(result, level);
    }
    if (activeMechanics.includes('padlock')) {
        result = applyPadlock(result, level);
    }
    if (activeMechanics.includes('ice')) {
        result = applyIce(result, level);
    }
    if (activeMechanics.includes('bomb')) {
        result = applyBomb(result, level);
    }
    if (activeMechanics.includes('smoke')) {
        result = applySmoke(result);
    }

    return result;
}

// ─── Mirror Dimension ────────────────────────────────────────────────────────
// ~25% of tiles get mirrored icons (flipX, flipY, rot90, rot270)

function applyMirror(tiles: TileState[], level: number): TileState[] {
    const variants: ('flipX' | 'flipY' | 'rot90' | 'rot270')[] = ['flipX', 'flipY', 'rot90', 'rot270'];
    // Scale percentage with level: 15% at level 4, up to 35% at level 15+
    const pct = Math.min(0.15 + (level - 4) * 0.02, 0.35);

    return tiles.map(t => {
        // Don't mirror special content types (images, bottles, calendars, clocks)
        if (t.content.type !== 'traditional') return t;
        if (Math.random() < pct) {
            return { ...t, isMirrored: variants[Math.floor(Math.random() * variants.length)] };
        }
        return t;
    });
}

// ─── Phasing / Ghost Tiles ───────────────────────────────────────────────────
// ~20% of tiles become ghosts that phase between solid and translucent every 5s

function applyGhost(tiles: TileState[], level: number): TileState[] {
    const pct = Math.min(0.12 + (level - 16) * 0.01, 0.25);
    return tiles.map(t => {
        if (t.content.type !== 'traditional') return t;
        if (Math.random() < pct) {
            return { ...t, isGhost: true };
        }
        return t;
    });
}

// ─── Padlock & Key System ────────────────────────────────────────────────────
// Level 31: 1 locked pair + 1 key pair
// Level 40+: chained locks (Key A → Lock A exposes Key B → Lock B)

function applyPadlock(tiles: TileState[], level: number): TileState[] {
    const unmatched = tiles.filter(t => !t.isMatched && t.content.type === 'traditional');
    if (unmatched.length < 8) return tiles; // Not enough tiles

    // Group by content value to find pairs
    const pairMap = new Map<string, TileState[]>();
    for (const t of unmatched) {
        const key = t.content.value;
        if (!pairMap.has(key)) pairMap.set(key, []);
        pairMap.get(key)!.push(t);
    }

    const validPairs = Array.from(pairMap.entries()).filter(([, v]) => v.length >= 2);
    if (validPairs.length < 2) return tiles;

    // Shuffle to randomize which pairs get locked/keyed
    const shuffled = validPairs.sort(() => Math.random() - 0.5);

    const numLocks = level >= 40 ? 2 : 1;
    const lockGroups: { lockPair: TileState[]; keyPair: TileState[] }[] = [];

    for (let i = 0; i < numLocks && i * 2 + 1 < shuffled.length; i++) {
        lockGroups.push({
            lockPair: shuffled[i * 2][1].slice(0, 2),
            keyPair: shuffled[i * 2 + 1][1].slice(0, 2),
        });
    }

    const lockedIds = new Set<string>();
    const result = tiles.map(t => ({ ...t }));

    for (let gi = 0; gi < lockGroups.length; gi++) {
        const group = lockGroups[gi];
        const lockId = `lock_${gi}`;

        for (const lockTile of group.lockPair) {
            const idx = result.findIndex(t => t.id === lockTile.id);
            if (idx !== -1) {
                result[idx] = { ...result[idx], isLocked: true, lockId };
                lockedIds.add(lockTile.id);
            }
        }
        // Key tiles are marked with lockId but NOT locked — matching them unlocks the lock
        for (const keyTile of group.keyPair) {
            const idx = result.findIndex(t => t.id === keyTile.id);
            if (idx !== -1) {
                result[idx] = { ...result[idx], lockId: `key_${gi}` };
            }
        }
    }

    return result;
}

// ─── Iced Tiles ──────────────────────────────────────────────────────────────
// ~15% of tiles start with iceCounter: 2 (need 2 adjacent matches to thaw)

function applyIce(tiles: TileState[], level: number): TileState[] {
    const pct = Math.min(0.10 + (level - 46) * 0.005, 0.20);
    return tiles.map(t => {
        if (t.content.type !== 'traditional') return t;
        if (t.isLocked || t.isGhost) return t; // Don't stack mechanics on same tile
        if (Math.random() < pct) {
            return { ...t, iceCounter: 2 };
        }
        return t;
    });
}

// ─── Bomb Tiles ──────────────────────────────────────────────────────────────
// 1–2 tiles become bombs with a 30-second countdown

function applyBomb(tiles: TileState[], level: number): TileState[] {
    const unmatched = tiles.filter(t =>
        !t.isMatched &&
        t.content.type === 'traditional' &&
        !t.isLocked &&
        !t.isGhost &&
        !t.iceCounter
    );
    if (unmatched.length < 4) return tiles;

    const numBombs = level >= 70 ? 2 : 1;
    const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
    const bombIds = new Set(shuffled.slice(0, numBombs).map(t => t.id));

    return tiles.map(t => {
        if (bombIds.has(t.id)) {
            return { ...t, isBomb: true, bombTimer: 30 };
        }
        return t;
    });
}

// ─── Smoke Bomb ──────────────────────────────────────────────────────────────
// Pick 1 random 3×3 grid section and mark those tiles as smoked

function applySmoke(tiles: TileState[]): TileState[] {
    const unmatched = tiles.filter(t => !t.isMatched && !t.isLocked && !t.isBomb);
    if (unmatched.length < 4) return tiles;

    // Pick a random tile as center of the smoke area
    const center = unmatched[Math.floor(Math.random() * unmatched.length)];

    // Find tiles within ±2 grid units of the center (covering a 3×3 logical area since tiles are on 2-unit grid)
    const smokedIds = new Set<string>();
    for (const t of tiles) {
        if (t.isMatched) continue;
        const dx = Math.abs(t.x - center.x);
        const dy = Math.abs(t.y - center.y);
        if (dx <= 2 && dy <= 2 && t.z === center.z) {
            smokedIds.add(t.id);
        }
    }

    return tiles.map(t => {
        if (smokedIds.has(t.id)) {
            return { ...t, isSmoked: true };
        }
        return t;
    });
}

// ─── Runtime Tick Functions ──────────────────────────────────────────────────

/**
 * Returns which ghost tile IDs are currently "solid" (clickable).
 * Ghosts toggle every 5 seconds. At any tick, roughly half are solid.
 */
export function getGhostSolidIds(tiles: TileState[], elapsedSeconds: number): Set<string> {
    const solidIds = new Set<string>();
    const ghostTiles = tiles.filter(t => t.isGhost && !t.isMatched);

    for (let i = 0; i < ghostTiles.length; i++) {
        // Stagger phases: even-indexed ghosts are solid on even 5s windows, odd on odd
        const phase = Math.floor(elapsedSeconds / 5) % 2;
        const isSolid = (i % 2 === 0) ? phase === 0 : phase === 1;
        if (isSolid) {
            solidIds.add(ghostTiles[i].id);
        }
    }
    return solidIds;
}

/**
 * Decrements bomb timers by 1. Returns whether any bomb exploded and updated tiles.
 */
export function tickBombs(tiles: TileState[]): { exploded: boolean; updatedTiles: TileState[] } {
    let exploded = false;
    const updatedTiles = tiles.map(t => {
        if (t.isBomb && !t.isMatched && t.bombTimer !== undefined) {
            const newTimer = t.bombTimer - 1;
            if (newTimer <= 0) {
                exploded = true;
                return { ...t, bombTimer: 0 };
            }
            return { ...t, bombTimer: newTimer };
        }
        return t;
    });
    return { exploded, updatedTiles };
}

// ─── Match Processing Functions ──────────────────────────────────────────────

/**
 * After a match, decrement iceCounter on adjacent tiles.
 * "Adjacent" = same layer, within ±2 grid units on x or y.
 */
export function processIceOnMatch(
    tiles: TileState[],
    matchedTile1: TileState,
    matchedTile2: TileState
): TileState[] {
    const matchedPositions = [matchedTile1, matchedTile2];

    return tiles.map(t => {
        if (!t.iceCounter || t.iceCounter <= 0 || t.isMatched) return t;

        // Check if any matched tile is adjacent
        for (const m of matchedPositions) {
            const dx = Math.abs(t.x - m.x);
            const dy = Math.abs(t.y - m.y);
            const dz = Math.abs(t.z - m.z);
            if (dz === 0 && dx <= 2 && dy <= 2) {
                const newCounter = t.iceCounter - 1;
                return { ...t, iceCounter: newCounter };
            }
        }
        return t;
    });
}

/**
 * After matching a key pair, unlock corresponding locked tiles.
 * Key tiles have lockId like "key_0", locked tiles have lockId like "lock_0".
 */
export function processLockUnlock(tiles: TileState[], matchedTile: TileState): TileState[] {
    if (!matchedTile.lockId || !matchedTile.lockId.startsWith('key_')) return tiles;

    const lockIndex = matchedTile.lockId.replace('key_', '');
    const targetLockId = `lock_${lockIndex}`;

    return tiles.map(t => {
        if (t.lockId === targetLockId && t.isLocked) {
            return { ...t, isLocked: false };
        }
        return t;
    });
}

/**
 * Clear smoke from all tiles (called after 15-second timer expires).
 */
export function clearSmoke(tiles: TileState[]): TileState[] {
    return tiles.map(t => {
        if (t.isSmoked) {
            return { ...t, isSmoked: false };
        }
        return t;
    });
}

/**
 * Re-trigger a new smoke bomb on a random 3×3 area.
 * Returns the updated tiles and the set of newly smoked IDs.
 */
export function triggerNewSmokeBomb(tiles: TileState[]): { tiles: TileState[]; smokedIds: string[] } {
    const cleared = clearSmoke(tiles);
    const unmatched = cleared.filter(t => !t.isMatched && !t.isLocked && !t.isBomb);
    if (unmatched.length < 4) return { tiles: cleared, smokedIds: [] };

    const center = unmatched[Math.floor(Math.random() * unmatched.length)];
    const smokedIds: string[] = [];

    const result = cleared.map(t => {
        if (t.isMatched) return t;
        const dx = Math.abs(t.x - center.x);
        const dy = Math.abs(t.y - center.y);
        if (dx <= 2 && dy <= 2 && t.z === center.z) {
            smokedIds.push(t.id);
            return { ...t, isSmoked: true };
        }
        return t;
    });

    return { tiles: result, smokedIds };
}

/**
 * Gravity collapse: tiles at z > 0 with no support below fall down.
 * "Support" means a tile exists at (x, y, z-1) that isn't matched.
 */
export function applyGravityCollapse(tiles: TileState[]): TileState[] {
    // Build occupancy grid
    const occupied = new Set<string>();
    for (const t of tiles) {
        if (!t.isMatched) {
            occupied.add(`${t.x},${t.y},${t.z}`);
        }
    }

    let changed = true;
    const result = tiles.map(t => ({ ...t }));

    // Iteratively drop tiles until stable
    let iterations = 0;
    while (changed && iterations < 10) {
        changed = false;
        iterations++;

        // Sort by z ascending so we process lower tiles first
        const floating = result
            .filter(t => !t.isMatched && t.z > 0)
            .sort((a, b) => a.z - b.z);

        for (const t of floating) {
            const belowKey = `${t.x},${t.y},${t.z - 1}`;
            if (!occupied.has(belowKey)) {
                // This tile has no support — drop it
                const currentKey = `${t.x},${t.y},${t.z}`;
                occupied.delete(currentKey);
                const idx = result.findIndex(r => r.id === t.id);
                if (idx !== -1) {
                    result[idx] = { ...result[idx], z: result[idx].z - 1 };
                    occupied.add(`${result[idx].x},${result[idx].y},${result[idx].z}`);
                    changed = true;
                }
            }
        }
    }

    return result;
}
