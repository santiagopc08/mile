'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, Clock, RotateCcw, Lightbulb } from 'lucide-react';

// Standard Mahjong unicode characters
const MAHJONG_UNICODE = [
    "🀀", "🀁", "🀂", "🀃", "🀄", "🀅", "🀆",
    "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
    "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘",
    "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"
];

interface TileContent {
    type: 'custom' | 'traditional';
    value: string;
}

interface TileState {
    id: string;
    x: number;
    y: number;
    z: number;
    content: TileContent;
    isMatched: boolean;
    isSelected: boolean;
    isHinted?: boolean;
}

// Shatter fragment data — pre-computed to avoid hydration mismatches
interface ShatterFragment {
    id: number;
    dx: number;
    dy: number;
    rot: number;
    clipPath: string;
}

function createShatterFragments(): ShatterFragment[] {
    const numFragments = 16;
    return Array.from({ length: numFragments }).map((_, i) => {
        const angle = (i * (360 / numFragments) + (Math.random() * 10 - 5)) * (Math.PI / 180);
        const power = 100 + Math.random() * 200;
        return {
            id: i,
            dx: power * Math.cos(angle),
            dy: power * Math.sin(angle),
            rot: Math.random() * 720 - 360,
            clipPath: `polygon(50% 50%, ${50 + Math.cos(angle - 0.35) * 75}% ${50 + Math.sin(angle - 0.35) * 75}%, ${50 + Math.cos(angle + 0.35) * 75}% ${50 + Math.sin(angle + 0.35) * 75}%)`
        };
    });
}

type LayoutType = 'turtle' | 'fortress' | 'peaks' | 'mobile' | 'random';

const LAYOUT_INFO: Record<LayoutType, { name: string; description: string; tiles: number }> = {
    turtle: { name: 'Tortuga Clásica', description: 'El diseño milenario en pirámide.', tiles: 144 },
    fortress: { name: 'La Fortaleza', description: 'Muros concéntricos de memorias.', tiles: 144 },
    peaks: { name: 'Picos Gemelos', description: 'Dos torres que se encuentran.', tiles: 144 },
    random: { name: 'Caos Equilibrado', description: 'Formación procedimental única.', tiles: 144 },
    mobile: { name: 'Modo Móvil', description: 'Diseño optimizado para tu pantalla.', tiles: 72 }
};

function generateCoordinates(type: LayoutType, isMobile: boolean = false) {
    const coords: { x: number, y: number, z: number }[] = [];

    if (type === 'random' || (isMobile && type !== 'mobile')) {
        const target = isMobile ? 72 : 144;
        const maxLayers = isMobile ? 3 : 5;
        const width = isMobile ? 12 : 20;
        const height = isMobile ? 14 : 16;

        // Base Layer (Fill ~60% of target)
        for (let x = 0; x < width; x += 2) {
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.4 && coords.length < target * 0.6) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }

        // Higher Layers (Build only on top of existing support)
        for (let z = 1; z < maxLayers; z++) {
            const potential = coords.filter(c => c.z === z - 1);
            potential.forEach(p => {
                if (Math.random() > 0.6 && coords.length < target) {
                    const exists = coords.some(c => c.x === p.x && c.y === p.y && c.z === z);
                    if (!exists) coords.push({ x: p.x, y: p.y, z });
                }
            });
        }

        // Safety-capped fill
        let fillIdx = 0;
        let safety = 0;
        while (coords.length < target && safety < 2000) {
            const x = (fillIdx % (width / 2)) * 2;
            const y = Math.floor(fillIdx / (width / 2)) * 2;
            if (!coords.some(c => c.x === x && c.y === y && c.z === 0)) {
                coords.push({ x, y, z: 0 });
            }
            fillIdx++;
            safety++;
        }

        return coords.slice(0, target);
    }

    if (type === 'mobile') {
        for (let x = 0; x <= 10; x += 2) for (let y = 0; y <= 14; y += 2) coords.push({ x, y, z: 0 });
        for (let x = 2; x <= 8; x += 2) for (let y = 2; y <= 10; y += 2) coords.push({ x, y, z: 1 });
        for (let x = 4; x <= 6; x += 2) for (let y = 6; y <= 8; y += 2) coords.push({ x, y, z: 2 });
        return coords.slice(0, 72);
    }

    if (type === 'turtle') {
        for (let x = 0; x <= 18; x += 2) for (let y = 0; y <= 14; y += 2) coords.push({ x, y, z: 0 });
        for (let x = 2; x <= 16; x += 2) for (let y = 2; y <= 12; y += 2) coords.push({ x, y, z: 1 });
        for (let x = 6; x <= 12; x += 2) for (let y = 4; y <= 8; y += 2) coords.push({ x, y, z: 2 });
        for (let x = 8; x <= 10; x += 2) for (let y = 4; y <= 6; y += 2) coords.push({ x, y, z: 3 });
    } else if (type === 'fortress') {
        for (let x = 0; x <= 22; x += 2) for (let y = 0; y <= 14; y += 2) if (x === 0 || x === 22 || y === 0 || y === 14) coords.push({ x, y, z: 0 });
        for (let x = 2; x <= 20; x += 2) for (let y = 2; y <= 12; y += 2) if (coords.length < 100) coords.push({ x, y, z: 0 });
        let i = 0;
        while (coords.length < 144) {
            coords.push({ x: 4 + (i % 8) * 2, y: 4 + Math.floor(i / 8) * 2, z: 1 + Math.floor(i / 16) });
            i++;
        }
    } else {
        // Peaks
        for (let x = 0; x <= 8; x += 2) for (let y = 2; y <= 10; y += 2) coords.push({ x, y, z: 0 });
        for (let x = 2; x <= 6; x += 2) for (let y = 4; y <= 8; y += 2) coords.push({ x, y, z: 1 });
        coords.push({ x: 4, y: 6, z: 2 });
        const offset = 12;
        for (let x = 0; x <= 8; x += 2) for (let y = 2; y <= 10; y += 2) coords.push({ x: x + offset, y, z: 0 });
        for (let x = 2; x <= 6; x += 2) for (let y = 4; y <= 8; y += 2) coords.push({ x: x + offset, y, z: 1 });
        coords.push({ x: 4 + offset, y: 6, z: 2 });
        for (let x = 4; x <= 14; x += 2) for (let y = 0; y <= 14; y += 2) {
            if (coords.length < 144) {
                const exists = coords.some(c => c.x === x && c.y === y && c.z === 0);
                if (!exists) coords.push({ x, y, z: 0 });
            }
        }
        // Fill remaining slots without duplicates
        let fillI = 0;
        const fillPositions = [];
        for (let fx = 0; fx <= 20; fx += 2) {
            for (let fy = 0; fy <= 14; fy += 2) {
                for (let fz = 0; fz <= 2; fz++) {
                    fillPositions.push({ x: fx, y: fy, z: fz });
                }
            }
        }
        while (coords.length < 144 && fillI < fillPositions.length) {
            const fp = fillPositions[fillI];
            const exists = coords.some(c => c.x === fp.x && c.y === fp.y && c.z === fp.z);
            if (!exists) coords.push(fp);
            fillI++;
        }
    }

    // Deduplicate coordinates (safety net for all layouts)
    const seen = new Set<string>();
    const deduped = coords.filter(c => {
        const key = `${c.x},${c.y},${c.z}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const target = isMobile ? 72 : 144;
    return deduped.slice(0, target);
}

// Fisher-Yates array shuffle
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

interface LeaderboardEntry {
    profile: string;
    time_seconds: number;
    layout: string;
    created_at: string;
}

// Checks if a tile is "free" using the same rules as the gameplay isTileFree.
// A tile is free if: (1) nothing sits on top of it, and (2) it's not blocked on BOTH left AND right.
function isSlotFree(
    target: { x: number; y: number; z: number },
    others: { x: number; y: number; z: number }[]
): boolean {
    // Top check
    const topBlocked = others.some(n =>
        n.z - target.z === 1 &&
        Math.abs(n.x - target.x) < 2 &&
        Math.abs(n.y - target.y) < 2
    );
    if (topBlocked) return false;

    // Lateral check
    const sameRow = others.filter(n => n.z === target.z && Math.abs(n.y - target.y) < 2);
    const hasLeft = sameRow.some(n => target.x - 2 <= n.x && n.x < target.x);
    const hasRight = sameRow.some(n => target.x < n.x && n.x <= target.x + 2);
    if (hasLeft && hasRight) return false;

    return true;
}

function generateSolvableBoard(rawCoords: { x: number; y: number; z: number }[], pairs: TileContent[]): TileState[] | null {
    const coords = rawCoords.map((c, i) => ({ ...c, id: `tile_${i}` }));

    for (let attempt = 0; attempt < 100; attempt++) {
        const pool = coords.map(c => ({ ...c }));
        const availablePairs = shuffleArray([...pairs]);
        const assignments = new Map<string, TileContent>();
        let deadlock = false;

        while (pool.length > 0) {
            // Find free tiles — exclude each candidate from the "others" list
            const freeSlots = pool.filter((target, _idx) => {
                const others = pool.filter(o => o.id !== target.id);
                return isSlotFree(target, others);
            });

            if (freeSlots.length < 2) {
                deadlock = true;
                break;
            }

            // Pick 2 distinct random free slots
            const i1 = Math.floor(Math.random() * freeSlots.length);
            let i2 = Math.floor(Math.random() * (freeSlots.length - 1));
            if (i2 >= i1) i2++;

            const slot1 = freeSlots[i1];
            const slot2 = freeSlots[i2];

            const pair = availablePairs.pop();
            if (!pair) { deadlock = true; break; }

            assignments.set(slot1.id, pair);
            assignments.set(slot2.id, pair);

            // Remove both from the pool
            for (let r = pool.length - 1; r >= 0; r--) {
                if (pool[r].id === slot1.id || pool[r].id === slot2.id) {
                    pool.splice(r, 1);
                }
            }
        }

        if (!deadlock && pool.length === 0) {
            return coords.map(c => ({
                id: c.id,
                x: c.x,
                y: c.y,
                z: c.z,
                content: assignments.get(c.id)!,
                isMatched: false,
                isSelected: false,
                isHinted: false
            }));
        }
    }
    return null;
}

export function Mahjong() {
    const { profile } = useProfile();
    const [tiles, setTiles] = useState<TileState[]>([]);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>('turtle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [initialDeal, setInitialDeal] = useState<TileState[] | null>(null);

    // Dock Mechanics State
    const [dockIds, setDockIds] = useState<string[]>([]);
    const [gameLost, setGameLost] = useState(false);
    const [undoStack, setUndoStack] = useState<string[][]>([]);

    // Timer state
    const [time, setTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);

    // Shatter state: tiles waiting for shatter animation before removal
    const [shatteringTiles, setShatteringTiles] = useState<Map<string, { tile: TileState; fragments: ShatterFragment[]; dockIndex?: number }>>(new Map());
    const [isNewRecord, setIsNewRecord] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load leaderboard on mount
    useEffect(() => {
        StoreService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive && matchedCount < tiles.length && tiles.length > 0) {
            interval = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, matchedCount, tiles.length]);

    // Win detection & score saving
    useEffect(() => {
        if (matchedCount === tiles.length && tiles.length > 0 && timerActive) {
            setTimerActive(false);

            // Check best time
            const pKey = profile as 'el' | 'ella';
            const bestScores = leaderboard[pKey] || [];
            const isRecord = bestScores.length === 0 || time < bestScores[0].time_seconds;
            setIsNewRecord(isRecord);

            // Save to DB
            if (profile && !scoreSaved) {
                setScoreSaved(true);
                StoreService.saveMahjongScore(
                    profile as 'el' | 'ella',
                    time,
                    currentLayout,
                    tiles.length
                ).then(() => {
                    StoreService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
                });
            }
        }
    }, [matchedCount, tiles.length, time, timerActive, profile, scoreSaved, currentLayout]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const initializeGame = async () => {
        const mobileState = window.innerWidth <= 768;
        const imageUrls = await StoreService.getMahjongImages();

        let selectedLayout: LayoutType;
        if (mobileState) {
            selectedLayout = 'mobile';
        } else {
            const possibleLayouts: LayoutType[] = ['turtle', 'fortress', 'peaks', 'random'];
            selectedLayout = possibleLayouts[Math.floor(Math.random() * possibleLayouts.length)];
        }
        setCurrentLayout(selectedLayout);

        const tilesCount = LAYOUT_INFO[selectedLayout].tiles;
        const pairsCount = tilesCount / 2;

        const pairs: TileContent[] = [];
        for (let i = 0; i < Math.min(imageUrls.length, pairsCount); i++) {
            pairs.push({ type: 'custom', value: imageUrls[i] });
        }
        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: MAHJONG_UNICODE[emojiIdx % MAHJONG_UNICODE.length] });
            emojiIdx++;
        }

        const rawCoords = generateCoordinates(selectedLayout, mobileState);

        let initialTiles = generateSolvableBoard(rawCoords, pairs);

        if (!initialTiles) {
            console.warn("Deadlock simulation hit 50 limit. Falling back to random shuffle.");
            const fullDeck = shuffleArray([...pairs, ...pairs]);
            initialTiles = rawCoords.map((coord, idx) => ({
                id: `tile_${idx}`,
                x: coord.x,
                y: coord.y,
                z: coord.z,
                content: fullDeck[idx],
                isMatched: false,
                isSelected: false,
                isHinted: false
            }));
        }

        setInitialDeal(initialTiles);
        setTiles(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setDockIds([]);
        setGameLost(false);
        setTime(0);
        setTimerActive(false);
        setScoreSaved(false);
        setIsNewRecord(false);
        setShatteringTiles(new Map());
        setIsLoaded(true);
    };

    useEffect(() => {
        if (!isLoaded) {
            initializeGame();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]);

    const isTileFree = (targetId: string, currentTiles: TileState[] = tiles) => {
        const T = currentTiles.find(t => t.id === targetId);
        if (!T || T.isMatched || dockIds.includes(targetId)) return false;

        const activeTiles = currentTiles.filter(t => !t.isMatched && !dockIds.includes(t.id) && t.id !== targetId);

        // Top Check (Z-Axis)
        const isTopCovered = activeTiles.some(n =>
            n.z - T.z === 1 &&
            Math.abs(n.x - T.x) < 2 &&
            Math.abs(n.y - T.y) < 2
        );

        if (isTopCovered) return false;

        // Lateral Check (X-Axis)
        const sameLayerRows = activeTiles.filter(n => n.z === T.z && Math.abs(n.y - T.y) < 2);
        const hasLeft = sameLayerRows.some(n => T.x - 2 <= n.x && n.x < T.x);
        const hasRight = sameLayerRows.some(n => T.x < n.x && n.x <= T.x + 2);

        if (hasLeft && hasRight) return false;

        return true;
    };

    const triggerShatter = useCallback((tile1: TileState, tile2: TileState, dockIndex?: number) => {
        setShatteringTiles(prev => {
            const next = new Map(prev);
            // We mark which tile was in the dock to render the shatter there
            next.set(tile1.id, { 
                tile: tile1, 
                fragments: createShatterFragments(),
                dockIndex: dockIndex // If provided, shatter appears in tray
            });
            next.set(tile2.id, { 
                tile: tile2, 
                fragments: createShatterFragments() 
            });
            return next;
        });

        // Remove shatter fragments after animation completes
        setTimeout(() => {
            setShatteringTiles(prev => {
                const next = new Map(prev);
                next.delete(tile1.id);
                next.delete(tile2.id);
                return next;
            });
        }, 1200);
    }, []);

    const handleTileClick = (id: string) => {
        if (gameLost || !isTileFree(id) || dockIds.includes(id) || tiles.find(t => t.id === id)?.isMatched) return;

        if (!timerActive && matchedCount < tiles.length) {
            setTimerActive(true);
        }

        const clickedTile = tiles.find(t => t.id === id)!;

        // Check if there is a matching tile in the dock
        const matchingDockId = dockIds.find(dId => {
            const dockTile = tiles.find(t => t.id === dId);
            return dockTile && dockTile.content.value === clickedTile.content.value;
        });

        if (matchingDockId) {
            const matchingDockTile = tiles.find(t => t.id === matchingDockId)!;
            const dockIndex = dockIds.indexOf(matchingDockId);
            
            setUndoStack(us => [...us, [matchingDockTile.id, clickedTile.id]]);
            setMatchedCount(mc => mc + 2);

            // Remove from dock
            setDockIds(prev => prev.filter(did => did !== matchingDockId));

            // Trigger shatter (passing tray index for the docked tile)
            triggerShatter(matchingDockTile, clickedTile, dockIndex);

            setTiles(prev => prev.map(t => {
                if (t.id === matchingDockTile.id || t.id === clickedTile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            }));
        } else {
            // No match found in the dock
            if (dockIds.length >= 3) {
                // Dock is full -> Loss
                setGameLost(true);
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
            } else {
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
            }
        }
    };

    const handleRestart = () => {
        if (initialDeal) {
            setTiles([...initialDeal]);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            setGameLost(false);
            setTime(0);
            setTimerActive(false);
            setScoreSaved(false);
            setIsNewRecord(false);
            setShatteringTiles(new Map());
        }
    };

    const handleHint = () => {
        const unmatched = tiles.filter(t => !t.isMatched);
        const freeOnBoard = unmatched.filter(t => !dockIds.includes(t.id) && isTileFree(t.id, tiles));
        const dockTilesArr = dockIds.map(dId => tiles.find(t => t.id === dId)!);
        const candidates = [...freeOnBoard, ...dockTilesArr];

        const groups = new Map<string, TileState[]>();
        for (const t of candidates) {
            const key = t.content.value;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
        }

        let hintFound: TileState[] | null = null;
        for (const [_, group] of Array.from(groups.entries())) {
            if (group.length >= 2) {
                hintFound = [group[0], group[1]];
                break;
            }
        }

        if (hintFound) {
            setTiles(prev => prev.map(t => {
                if (hintFound![0].id === t.id || hintFound![1].id === t.id) {
                    return { ...t, isHinted: true };
                }
                return t;
            }));

            setTimeout(() => {
                setTiles(prev => prev.map(t => {
                    if (hintFound![0].id === t.id || hintFound![1].id === t.id) {
                        return { ...t, isHinted: false };
                    }
                    return t;
                }));
            }, 1500);
        }
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;

        const stackCopy = [...undoStack];
        const lastAction = stackCopy.pop()!;
        setUndoStack(stackCopy);

        if (lastAction.length === 1) {
            // Un-dock
            const id = lastAction[0];
            setDockIds(prev => prev.filter(did => did !== id));
            setGameLost(false);
        } else if (lastAction.length === 2) {
            // Un-match
            const [idDock, idBoard] = lastAction;
            setDockIds(prev => [...prev, idDock]);
            setTiles(prev => prev.map(t => {
                if (t.id === idDock || t.id === idBoard) {
                    return { ...t, isMatched: false, isSelected: false };
                }
                return t;
            }));
            setMatchedCount(mc => mc - 2);
        }
    };

    // Helper to compute tile position
    const getTilePosition = (tile: TileState) => {
        const pxShift = tile.z * -6;
        const spacingX = isMobile ? 1.5 : 2;
        const spacingY = isMobile ? 1.8 : 2.2;
        const halfWidth = isMobile ? 1.6 : 1.75;

        const xRem = (tile.x - (isMobile ? 5 : 9)) * spacingX;
        const yRem = tile.y * spacingY;

        return {
            left: `calc(50% - ${halfWidth}rem + ${xRem}rem + ${pxShift}px)`,
            top: `calc(${yRem}rem + ${pxShift}px)`,
            zIndex: tile.z * 100 + tile.y,
        };
    };

    const getBestForProfile = (p: 'el' | 'ella') => {
        const scores = leaderboard[p];
        return scores.length > 0 ? scores[0] : null;
    };

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-12 h-12 rounded-full border-4 border-earth-base border-t-transparent animate-spin" /></div></div>;
    }

    const gameWon = matchedCount > 0 && matchedCount === tiles.length;

    const TileVisual = ({ tile }: { tile: TileState }) => (
        tile.content.type === 'custom' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tile.content.value} alt="Memory" className="w-full h-full object-cover p-0.5 rounded-md select-none pointer-events-none" />
        ) : (
            <div className={`w-full h-full flex items-center justify-center text-[2rem] md:text-[2.2rem] leading-none select-none pointer-events-none ${tile.content.value === '🀄' || tile.content.value === '🀆' ? 'text-red-500' : 'text-stone-800 dark:text-stone-300'}`}>
                {tile.content.value}
            </div>
        )
    );

    return (
        <div className="w-full flex justify-center items-center flex-col py-8 md:py-12 relative overflow-hidden bg-stone-50 dark:bg-stone-950">

            {/* Header */}
            <div className="w-full max-w-5xl px-6 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div className="space-y-1 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-light text-stone-800 dark:text-stone-200">Mahjong<span className="text-earth-base italic font-medium">Vita</span></h2>
                        <span className="px-2 py-0.5 rounded-full bg-earth-base/10 text-earth-base text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                            {LAYOUT_INFO[currentLayout].name}
                        </span>
                    </div>

                    {/* Timer + Best Times */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold"><Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />Tiempo</span>
                            <span className="text-xl font-mono text-earth-base tabular-nums">{formatTime(time)}</span>
                        </div>
                        {/* Mini leaderboard */}
                        {(leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                            <div className="flex gap-3 border-l border-stone-200 dark:border-stone-700 pl-4">
                                {getBestForProfile('el') && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] text-amber-500 uppercase tracking-widest font-bold">Él</span>
                                        <span className="text-sm font-mono text-stone-600 dark:text-stone-400 tabular-nums">{formatTime(getBestForProfile('el')!.time_seconds)}</span>
                                    </div>
                                )}
                                {getBestForProfile('ella') && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] text-rose-500 uppercase tracking-widest font-bold">Ella</span>
                                        <span className="text-sm font-mono text-stone-600 dark:text-stone-400 tabular-nums">{formatTime(getBestForProfile('ella')!.time_seconds)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-3 md:gap-4 w-full md:w-auto justify-center">
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 shadow-sm disabled:opacity-40 hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                        <Undo2 className="w-3 md:w-4 h-3 md:h-4" /> Deshacer
                    </button>
                    <button
                        onClick={handleHint}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shadow-sm hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                        <Lightbulb className="w-3 md:w-4 h-3 md:h-4" /> Pista
                    </button>
                    <button
                        onClick={handleRestart}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-earth-base text-white shadow-md shadow-earth-base/20 hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                        <RotateCcw className="w-3 md:w-4 h-3 md:h-4" /> Reiniciar
                    </button>
                </div>
            </div>

            {/* Dock Area */}
            {tiles.length > 0 && (
                <div className="w-full max-w-md mx-auto mb-8 px-4 z-20 relative flex justify-center">
                    <div className="flex bg-stone-200/80 dark:bg-stone-800/80 backdrop-blur-md p-3 rounded-2xl gap-3 shadow-inner border border-stone-300 dark:border-stone-700 min-w-[280px] h-[5.5rem] items-center justify-center relative">
                        {[0, 1, 2].map(index => {
                            const tileId = dockIds[index];
                            const dockTile = tileId ? tiles.find(t => t.id === tileId) : null;
                            const isHinted = dockTile?.isHinted;

                            // Check if a tile was JUST in this slot and is now shattering
                            const shatteringData = Array.from(shatteringTiles.values()).find(s => s.dockIndex === index);

                            return (
                                <div key={`slot-${index}`} className="w-[3.5rem] h-[4.2rem] bg-stone-300/40 dark:bg-stone-900/40 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-400/30 dark:border-stone-600/30 relative shrink-0">
                                    {dockTile && (
                                        <motion.div
                                            layoutId={dockTile.id}
                                            initial={{ y: 200, scale: 0.8, opacity: 0 }}
                                            animate={{ y: 0, scale: 1, opacity: 1 }}
                                            transition={{ 
                                                type: 'spring', 
                                                stiffness: 80, 
                                                damping: 20,
                                                mass: 1.2
                                            }}
                                            className={`w-full h-full border shadow-sm flex items-center justify-center rounded-lg absolute inset-0 transition-colors ${isHinted
                                                    ? 'bg-amber-50 dark:bg-amber-900/60 ring-[4px] ring-amber-400 border-transparent z-50 animate-pulse'
                                                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                                                }`}
                                        >
                                            <TileVisual tile={dockTile} />
                                        </motion.div>
                                    )}

                                    {/* Shatter fragments inside the slot */}
                                    {shatteringData && (
                                        <div className="absolute inset-0 z-50 pointer-events-none">
                                            {shatteringData.fragments.map((frag) => (
                                                <motion.div
                                                    key={`frag-dock-${frag.id}`}
                                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1.1 }}
                                                    animate={{
                                                        x: frag.dx * 0.4, // Constrained for the slot size
                                                        y: frag.dy * 0.4,
                                                        opacity: 0,
                                                        scale: 0.2,
                                                        rotate: frag.rot
                                                    }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className="absolute inset-0 rounded-sm shadow-md"
                                                    style={{
                                                        clipPath: frag.clipPath,
                                                        background: `linear-gradient(${frag.rot}deg, #b8860b, #daa520, #f8d48e)`,
                                                        border: '1px solid rgba(184, 134, 11, 0.5)'
                                                    }}
                                                />
                                            ))}
                                            <motion.div
                                                initial={{ opacity: 1, scale: 0.8 }}
                                                animate={{ opacity: 0, scale: 2 }}
                                                transition={{ duration: 0.6 }}
                                                className="absolute inset-0 bg-amber-400/30 blur-sm rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Game Over Overflow Overlay */}
            {gameLost && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-[1000] top-1/4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl px-8 md:px-12 py-10 md:py-12 rounded-[2.5rem] border border-red-200 dark:border-red-900/50 shadow-2xl flex flex-col items-center max-w-md w-[90%]"
                >
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
                        <RotateCcw className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif italic text-stone-800 dark:text-stone-100 mb-2">Sin Espacio</h3>
                    <p className="text-stone-500 font-light mb-8 text-center text-sm">Tu bandeja se ha llenado con cartas sin emparejar. ¡Inténtalo de nuevo!</p>
                    <button
                        onClick={handleRestart}
                        className="px-8 py-3 rounded-xl bg-earth-base text-white shadow-lg hover:scale-105 transition-transform active:scale-95 font-medium"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={handleUndo}
                        className="mt-4 px-6 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center gap-2"
                    >
                        <Undo2 className="w-4 h-4" /> Deshacer movimiento
                    </button>
                </motion.div>
            )}

            {/* Victory Overlay */}
            {gameWon && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-[1000] top-1/4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl px-8 md:px-12 py-10 md:py-12 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col items-center max-w-md w-[90%]"
                >
                    <div className="w-16 h-16 rounded-full bg-earth-base/10 flex items-center justify-center mb-5">
                        <Trophy className="w-8 h-8 text-earth-base" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif italic text-earth-base mb-2">¡Triunfo!</h3>
                    <p className="text-stone-500 font-light mb-6 text-center text-sm">Has liberado todas nuestras memorias.</p>

                    {isNewRecord && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-full font-bold text-sm mb-4 border border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-300/20"
                        >
                            🎉 ¡NUEVO RÉCORD! 🎉
                        </motion.div>
                    )}

                    {/* Current game score */}
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-4 w-full mb-6">
                        <div className="text-center">
                            <span className="block text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Tu Tiempo</span>
                            <span className="text-3xl font-mono text-stone-800 dark:text-stone-100">{formatTime(time)}</span>
                            <span className={`block text-[10px] mt-1 uppercase font-bold ${profile === 'ella' ? 'text-rose-500' : 'text-amber-500'}`}>
                                {profile === 'el' ? 'Santiago' : 'Mile'}
                            </span>
                        </div>
                    </div>

                    {/* Leaderboard Table */}
                    {(leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                        <div className="w-full mb-6">
                            <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-3 text-center">Tabla de Récords</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block text-center">Él</span>
                                    {leaderboard.el.length > 0 ? leaderboard.el.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-lg px-3 py-1.5 text-xs border border-stone-100 dark:border-stone-700">
                                            <span className="text-stone-400 font-mono">#{i + 1}</span>
                                            <span className="font-mono text-stone-700 dark:text-stone-300 tabular-nums">{formatTime(s.time_seconds)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-stone-300 text-center italic">Sin récords</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block text-center">Ella</span>
                                    {leaderboard.ella.length > 0 ? leaderboard.ella.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-lg px-3 py-1.5 text-xs border border-stone-100 dark:border-stone-700">
                                            <span className="text-stone-400 font-mono">#{i + 1}</span>
                                            <span className="font-mono text-stone-700 dark:text-stone-300 tabular-nums">{formatTime(s.time_seconds)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-stone-300 text-center italic">Sin récords</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { setIsLoaded(false); }} className="w-full bg-earth-base text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-earth-base/30 hover:brightness-110 active:scale-95 transition-all">Jugar de nuevo</button>
                </motion.div>
            )}

            {/* Board Container */}
            <div className="relative w-full max-w-[800px] min-h-[600px] md:min-h-[700px] flex justify-center">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 768px) {
                        .tile-item {
                            width: 3.2rem;
                            height: 4.0rem;
                        }
                    }
                    @media (min-width: 769px) {
                        .tile-item {
                            width: 3.5rem;
                            height: 4.2rem;
                        }
                    }
                `}} />

                {/* Main Tiles */}
                <AnimatePresence>
                    {tiles.map(tile => {
                        if (tile.isMatched || dockIds.includes(tile.id)) return null;

                        const isFree = isTileFree(tile.id);
                        const pos = getTilePosition(tile);
                        const vOffset = tile.isSelected ? -8 : 0;

                        return (
                            <motion.div
                                key={tile.id}
                                layoutId={tile.id}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                    opacity: 0,
                                    scale: 1.3,
                                    transition: { duration: 0.3 }
                                }}
                                onClick={() => handleTileClick(tile.id)}
                                style={{
                                    position: 'absolute',
                                    left: pos.left,
                                    top: `calc(${pos.top} + ${vOffset}px)`,
                                    zIndex: pos.zIndex,
                                }}
                                className={`
                                    tile-item rounded-lg flex items-center justify-center overflow-hidden
                                    transition-all duration-300 shadow-md relative
                                    ${isFree
                                        ? 'cursor-pointer hover:brightness-110 active:scale-95 dark:border-stone-600'
                                        : 'brightness-50 dark:brightness-[0.35] grayscale-[0.8] cursor-not-allowed opacity-60 dark:opacity-40'}
                                    ${tile.isHinted
                                        ? 'bg-amber-50 dark:bg-amber-900/60 ring-[5px] ring-amber-400 dark:ring-amber-500 shadow-amber-400/50 shadow-2xl z-50 animate-pulse'
                                        : tile.isSelected
                                            ? 'bg-amber-100 dark:bg-amber-900/80 ring-2 ring-earth-base shadow-xl shadow-earth-base/20'
                                            : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 border-r-[3px] border-b-[4px]'}
                                `}
                            >
                                {tile.isSelected && (
                                    <div className="absolute inset-0 ring-3 ring-earth-base/40 rounded-lg animate-pulse pointer-events-none" />
                                )}

                                <TileVisual tile={tile} />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Shatter Fragments Layer (Board Tiles only) */}
                {Array.from(shatteringTiles.entries()).map(([tileId, { tile, fragments, dockIndex }]) => {
                    if (dockIndex !== undefined) return null; // These shatter in the tray
                    const pos = getTilePosition(tile);
                    return (
                        <div
                            key={`shatter-${tileId}`}
                            style={{
                                position: 'absolute',
                                left: pos.left,
                                top: pos.top,
                                zIndex: pos.zIndex + 200,
                            }}
                            className="tile-item pointer-events-none"
                        >
                            {fragments.map((frag) => (
                                <motion.div
                                    key={frag.id}
                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1.1, rotate: 0 }}
                                    animate={{
                                        x: frag.dx,
                                        y: frag.dy,
                                        opacity: [1, 0.9, 0.6, 0],
                                        scale: [1.1, 0.8, 0.4],
                                        rotate: frag.rot,
                                    }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="absolute inset-0 rounded-sm shadow-lg"
                                    style={{
                                        clipPath: frag.clipPath,
                                        background: `linear-gradient(${frag.rot}deg, #b8860b, #d4a853, #f5e6c8)`,
                                        border: '1px solid rgba(180, 130, 50, 0.6)',
                                    }}
                                />
                            ))}
                            {/* Central flash */}
                            <motion.div
                                initial={{ opacity: 1, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 3 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="absolute inset-0 bg-amber-400/40 rounded-lg blur-md"
                            />
                            {/* Secondary glow ring */}
                            <motion.div
                                initial={{ opacity: 0.6, scale: 1 }}
                                animate={{ opacity: 0, scale: 2 }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                className="absolute inset-0 ring-2 ring-amber-300/50 rounded-lg"
                            />
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
