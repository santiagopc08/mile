'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { MahjongService } from '@/services/mahjongService';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, RotateCcw, Lightbulb, Layers3, Sparkles } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import MahjongTimer, { MahjongTimerHandle } from './MahjongTimer';
import MahjongTile, { TileState, TileContent, TileVisual } from './MahjongTile';

const MAHJONG_UNICODE = [
    "🀀", "🀁", "🀂", "🀃", "🀄", "🀅", "🀆",
    "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
    "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘",
    "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"
];

type LayoutType = 'turtle' | 'fortress' | 'peaks' | 'mobile' | 'random';

const LAYOUT_INFO: Record<LayoutType, { name: string; description: string; tiles: number }> = {
    turtle: { name: 'Tortuga Clásica', description: 'El diseño milenario en pirámide.', tiles: 144 },
    fortress: { name: 'La Fortaleza', description: 'Muros concéntricos de memorias.', tiles: 144 },
    peaks: { name: 'Picos Gemelos', description: 'Dos torres que se encuentran.', tiles: 144 },
    random: { name: 'Caos Equilibrado', description: 'Formación procedimental única.', tiles: 144 },
    mobile: { name: 'Modo Móvil', description: 'Diseño optimizado para tu pantalla.', tiles: 72 }
};

function generateCoordinates(type: LayoutType) {
    const coords: { x: number, y: number, z: number }[] = [];
    const target = LAYOUT_INFO[type].tiles;

    if (type === 'random') {
        const maxLayers = 5;
        const width = 20;
        const height = 16;
        for (let x = 0; x < width; x += 2) {
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.4 && coords.length < target * 0.6) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }
        const coordSet = new Set<string>();
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i];
            coordSet.add(`${c.x},${c.y},${c.z}`);
        }

        for (let z = 1; z < maxLayers; z++) {
            const potential = coords.filter(c => c.z === z - 1);
            potential.forEach(p => {
                if (Math.random() > 0.6 && coords.length < target) {
                    const key = `${p.x},${p.y},${z}`;
                    if (!coordSet.has(key)) {
                        coordSet.add(key);
                        coords.push({ x: p.x, y: p.y, z });
                    }
                }
            });
        }
        let fillIdx = 0;
        let safety = 0;
        while (coords.length < target && safety < 2000) {
            const x = (fillIdx % (width / 2)) * 2;
            const y = Math.floor(fillIdx / (width / 2)) * 2;
            const key = `${x},${y},0`;
            if (!coordSet.has(key)) {
                coordSet.add(key);
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
        for (let x = 0; x <= 8; x += 2) for (let y = 2; y <= 10; y += 2) coords.push({ x, y, z: 0 });
        for (let x = 2; x <= 6; x += 2) for (let y = 4; y <= 8; y += 2) coords.push({ x, y, z: 1 });
        coords.push({ x: 4, y: 6, z: 2 });
        const offset = 12;
        for (let x = 0; x <= 8; x += 2) for (let y = 2; y <= 10; y += 2) coords.push({ x: x + offset, y, z: 0 });
        for (let x = 2; x <= 6; x += 2) for (let y = 4; y <= 8; y += 2) coords.push({ x: x + offset, y, z: 1 });
        coords.push({ x: 4 + offset, y: 6, z: 2 });
        const coordSet = new Set<string>();
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i];
            coordSet.add(`${c.x},${c.y},${c.z}`);
        }

        for (let x = 4; x <= 14; x += 2) for (let y = 0; y <= 14; y += 2) {
            if (coords.length < 144) {
                const key = `${x},${y},0`;
                if (!coordSet.has(key)) {
                    coordSet.add(key);
                    coords.push({ x, y, z: 0 });
                }
            }
        }
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
            const key = `${fp.x},${fp.y},${fp.z}`;
            if (!coordSet.has(key)) {
                coordSet.add(key);
                coords.push(fp);
            }
            fillI++;
        }
    }

    const seen = new Set<string>();
    const deduped = coords.filter(c => {
        const key = `${c.x},${c.y},${c.z}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return deduped.slice(0, target);
}

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

function isSlotFree(
    target: { x: number; y: number; z: number },
    grid: Set<number>
): boolean {
    const { x, y, z } = target;
    const zUp = (z + 1) * 10000;

    // ⚡ Bolt Optimization: Unrolled loops for O(1) direct property lookups to avoid O(N) intermediate allocations
    if (grid.has(zUp + (y - 1) * 100 + (x - 1)) ||
        grid.has(zUp + (y - 1) * 100 + x) ||
        grid.has(zUp + (y - 1) * 100 + (x + 1)) ||
        grid.has(zUp + y * 100 + (x - 1)) ||
        grid.has(zUp + y * 100 + x) ||
        grid.has(zUp + y * 100 + (x + 1)) ||
        grid.has(zUp + (y + 1) * 100 + (x - 1)) ||
        grid.has(zUp + (y + 1) * 100 + x) ||
        grid.has(zUp + (y + 1) * 100 + (x + 1))) {
        return false;
    }

    const zSame = z * 10000;
    const hasLeft =
        grid.has(zSame + (y - 1) * 100 + (x - 2)) ||
        grid.has(zSame + y * 100 + (x - 2)) ||
        grid.has(zSame + (y + 1) * 100 + (x - 2)) ||
        grid.has(zSame + (y - 1) * 100 + (x - 1)) ||
        grid.has(zSame + y * 100 + (x - 1)) ||
        grid.has(zSame + (y + 1) * 100 + (x - 1));

    if (!hasLeft) return true;

    const hasRight =
        grid.has(zSame + (y - 1) * 100 + (x + 1)) ||
        grid.has(zSame + y * 100 + (x + 1)) ||
        grid.has(zSame + (y + 1) * 100 + (x + 1)) ||
        grid.has(zSame + (y - 1) * 100 + (x + 2)) ||
        grid.has(zSame + y * 100 + (x + 2)) ||
        grid.has(zSame + (y + 1) * 100 + (x + 2));

    return !hasRight;
}

function tryGenerateBoard(
    coords: { x: number; y: number; z: number; id: string }[],
    availablePairs: TileContent[]
): TileState[] | null {
    let pool = coords.map(c => ({ ...c }));
    const assignments = new Map<string, TileContent>();
    let deadlock = false;

    while (pool.length > 0) {
        const grid = new Set<number>();
        for (const t of pool) {
            grid.add(t.z * 10000 + t.y * 100 + t.x);
        }

        const freeSlots = pool.filter((target, _idx) => {
            return isSlotFree(target, grid);
        });
        if (freeSlots.length < 2) {
            deadlock = true;
            break;
        }
        const i1 = Math.floor(Math.random() * freeSlots.length);
        let i2 = Math.floor(Math.random() * (freeSlots.length - 1));
        if (i2 >= i1) i2++;
        const slot1 = freeSlots[i1];
        const slot2 = freeSlots[i2];
        const pair = availablePairs.pop();
        if (!pair) { deadlock = true; break; }
        assignments.set(slot1.id, pair);
        assignments.set(slot2.id, pair);

        pool = pool.filter(p => p.id !== slot1.id && p.id !== slot2.id);
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
    return null;
}

function generateSolvableBoard(rawCoords: { x: number; y: number; z: number }[], pairs: TileContent[]): TileState[] | null {
    const coords = rawCoords.map((c, i) => ({ ...c, id: `tile_${i}` }));
    for (let attempt = 0; attempt < 100; attempt++) {
        const availablePairs = shuffleArray([...pairs]);
        const result = tryGenerateBoard(coords, availablePairs);
        if (result) return result;
    }
    return null;
}

export function Mahjong() {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

    const [tiles, setTiles] = useState<TileState[]>([]);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>('turtle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [initialDeal, setInitialDeal] = useState<TileState[] | null>(null);

    const timerRef = useRef<MahjongTimerHandle>(null);
    const [dockIds, setDockIds] = useState<string[]>([]);
    const [gameLost, setGameLost] = useState(false);
    const [undoStack, setUndoStack] = useState<string[][]>([]);
    const [timerActive, setTimerActive] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);
    const [shatteringTiles, setShatteringTiles] = useState<Map<string, { tile: TileState; dockIndex?: number }>>(new Map());
    const [isNewRecord, setIsNewRecord] = useState(false);

    const isProcessingRef = useRef(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        MahjongService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (matchedCount === tiles.length && tiles.length > 0 && timerActive) {
            setTimerActive(false);
            const time = timerRef.current?.getTime() || 0;
            const pKey = profile as 'el' | 'ella';
            const bestScores = leaderboard[pKey] || [];
            const isRecord = bestScores.length === 0 || time < bestScores[0].time_seconds;
            setIsNewRecord(isRecord);

            if (profile && !scoreSaved) {
                setScoreSaved(true);
                MahjongService.saveMahjongScore(
                    profile as 'el' | 'ella',
                    time,
                    currentLayout,
                    tiles.length
                ).then(() => {
                    MahjongService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });

                    // Notificar a la pareja si es récord
                    if (isRecord) {
                        const target = profile === 'el' ? 'ella' : 'el';
                        const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                        NotificationService.addNotification(target, 'mahjong_record', `¡Récord Superado!: ${authorName} batió el récord en el juego con un tiempo de ${formatTime(time)}! 🏆`).catch(e => console.error(e));
                    }
                });
            }
        }
    }, [matchedCount, tiles.length, timerActive, profile, scoreSaved, currentLayout, leaderboard]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const boardSpanX = useMemo(() => {
        if (tiles.length === 0) return 18;
        const xs = tiles.map(t => t.x);
        return Math.max(...xs) - Math.min(...xs);
    }, [tiles]);

    const boardSpanY = useMemo(() => {
        if (tiles.length === 0) return 14;
        const ys = tiles.map(t => t.y);
        return Math.max(...ys) - Math.min(...ys);
    }, [tiles]);

    const centerX = useMemo(() => {
        if (tiles.length === 0) return 9;
        const xs = tiles.map(t => t.x);
        return (Math.min(...xs) + Math.max(...xs)) / 2;
    }, [tiles]);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const spacingX = isMobile ? 1.5 : 2.0;
            const tileWidth = isMobile ? 3.2 : 3.5;
            const boardWidthRem = boardSpanX * spacingX + tileWidth;
            const boardWidthPx = boardWidthRem * 16;
            
            if (boardWidthPx > containerWidth) {
                setScale((containerWidth - 10) / boardWidthPx);
            } else {
                setScale(1);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        const timeoutId = setTimeout(updateScale, 150);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timeoutId);
        };
    }, [isMobile, boardSpanX, tiles]);

    const initializeGame = async (layoutParam?: LayoutType) => {
        const mobileState = window.innerWidth <= 768;
        const imageUrls = shuffleArray(await MahjongService.getMahjongImages());

        let selectedLayout = layoutParam || currentLayout;
        if (!selectedLayout) {
            selectedLayout = mobileState ? 'mobile' : 'turtle';
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
        const rawCoords = generateCoordinates(selectedLayout);
        let initialTiles = generateSolvableBoard(rawCoords, pairs);
        if (!initialTiles) {
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
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setShatteringTiles(new Map());
        setIsLoaded(true);
    };

    useEffect(() => {
        if (!isLoaded) { initializeGame(); }
    }, [isLoaded]);

    const { freeTilesMap, tilesById } = useMemo(() => {
        const freeMap = new Map<string, boolean>();
        const idMap = new Map<string, TileState>();
        const dockSet = new Set(dockIds);
        const grid = new Set<number>();

        for (const tile of tiles) {
            idMap.set(tile.id, tile);
            if (!tile.isMatched && !dockSet.has(tile.id)) {
                grid.add(tile.z * 10000 + tile.y * 100 + tile.x);
            }
        }

        for (const tile of tiles) {
            if (tile.isMatched || dockSet.has(tile.id)) {
                freeMap.set(tile.id, false);
                continue;
            }

            const { x, y, z } = tile;
            const zUp = (z + 1) * 10000;

            // ⚡ Bolt Optimization: Unrolled loops for O(1) direct property lookups to avoid O(N) nested loops
            if (grid.has(zUp + (y - 1) * 100 + (x - 1)) ||
                grid.has(zUp + (y - 1) * 100 + x) ||
                grid.has(zUp + (y - 1) * 100 + (x + 1)) ||
                grid.has(zUp + y * 100 + (x - 1)) ||
                grid.has(zUp + y * 100 + x) ||
                grid.has(zUp + y * 100 + (x + 1)) ||
                grid.has(zUp + (y + 1) * 100 + (x - 1)) ||
                grid.has(zUp + (y + 1) * 100 + x) ||
                grid.has(zUp + (y + 1) * 100 + (x + 1))) {
                freeMap.set(tile.id, false);
                continue;
            }

            const zSame = z * 10000;

            const hasLeft =
                grid.has(zSame + (y - 1) * 100 + (x - 2)) ||
                grid.has(zSame + y * 100 + (x - 2)) ||
                grid.has(zSame + (y + 1) * 100 + (x - 2)) ||
                grid.has(zSame + (y - 1) * 100 + (x - 1)) ||
                grid.has(zSame + y * 100 + (x - 1)) ||
                grid.has(zSame + (y + 1) * 100 + (x - 1));

            if (!hasLeft) {
                freeMap.set(tile.id, true);
                continue;
            }

            const hasRight =
                grid.has(zSame + (y - 1) * 100 + (x + 1)) ||
                grid.has(zSame + y * 100 + (x + 1)) ||
                grid.has(zSame + (y + 1) * 100 + (x + 1)) ||
                grid.has(zSame + (y - 1) * 100 + (x + 2)) ||
                grid.has(zSame + y * 100 + (x + 2)) ||
                grid.has(zSame + (y + 1) * 100 + (x + 2));

            freeMap.set(tile.id, !hasRight);
        }
        return { freeTilesMap: freeMap, tilesById: idMap };
    }, [tiles, dockIds]);

    const triggerShatter = useCallback((tileA: TileState, tileB: TileState, dockIndex?: number) => {
        setShatteringTiles(prev => {
            const next = new Map(prev);
            next.set(tileA.id, { tile: tileA, dockIndex });
            next.set(tileB.id, { tile: tileB, dockIndex });
            return next;
        });
        setTimeout(() => {
            setShatteringTiles(prev => {
                const next = new Map(prev);
                next.delete(tileA.id);
                next.delete(tileB.id);
                return next;
            });
        }, 700);
    }, []);

    const handleTilePointerDown = useCallback((id: string) => {
        if (isProcessingRef.current || gameLost) return;
        if (dockIds.includes(id)) return;
        const tile = tilesById.get(id);
        if (!tile || tile.isMatched || !freeTilesMap.get(id)) return;
        isProcessingRef.current = true;
        requestAnimationFrame(() => { isProcessingRef.current = false; });
        if (!timerActive && matchedCount < tiles.length) { setTimerActive(true); }

        // ⚡ Bolt Optimization: Replace find with O(1) dock checks
        let matchingDockTile: TileState | undefined = undefined;
        let matchingDockId: string | undefined = undefined;
        for (const dId of dockIds) {
            const dt = tilesById.get(dId);
            if (dt && dt.content.value === tile.content.value) {
                matchingDockTile = dt;
                matchingDockId = dt.id;
                break;
            }
        }

        if (matchingDockId && matchingDockTile) {
            const dockIndex = dockIds.indexOf(matchingDockId);
            setUndoStack(us => [...us, [matchingDockTile.id, tile.id]]);
            setMatchedCount(mc => mc + 2);
            setDockIds(prev => prev.filter(did => did !== matchingDockId));
            triggerShatter(matchingDockTile, tile, dockIndex);
            setTiles(prev => prev.map(t => {
                if (t.id === matchingDockTile.id || t.id === tile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            }));
        } else {
            if (dockIds.length >= 2) {
                setGameLost(true);
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
            } else {
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
            }
        }
    }, [tilesById, gameLost, dockIds, tiles, freeTilesMap, timerActive, matchedCount, triggerShatter]);

    const handleRestart = () => {
        if (initialDeal) {
            setTiles([...initialDeal]);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            setGameLost(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);
            setShatteringTiles(new Map());
        }
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const lastMove = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, prev.length - 1));
        if (lastMove.length === 2) {
            const [id1, id2] = lastMove;
            setTiles(prev => prev.map(t =>
                (t.id === id1 || t.id === id2) ? { ...t, isMatched: false, isSelected: false } : t
            ));
            setMatchedCount(mc => mc - 2);
        } else {
            const [id] = lastMove;
            setDockIds(prev => prev.filter(did => did !== id));
            setGameLost(false);
        }
    };

    const handleHint = useCallback(() => {
        const freeOnBoard = tiles.filter(t => !t.isMatched && !dockIds.includes(t.id) && freeTilesMap.get(t.id));
        const seenValues = new Map<string, string>();
        for (const tile of freeOnBoard) {
            const value = tile.content.value;
            if (seenValues.has(value)) {
                const id1 = seenValues.get(value)!;
                const id2 = tile.id;
                setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
            seenValues.set(value, tile.id);
        }

        for (const dId of dockIds) {
            const dockTile = tilesById.get(dId);
            if (!dockTile) continue;
            const match = freeOnBoard.find(t => t.content.value === dockTile.content.value);
            if (match) {
                setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
        }
    }, [tiles, dockIds, freeTilesMap, tilesById]);

    const getTileStyle = useCallback((tile: TileState) => {
        const pxShift = tile.z * -6;
        const spacingX = isMobile ? 1.5 : 2;
        const spacingY = isMobile ? 1.8 : 2.2;
        const halfWidth = isMobile ? 1.6 : 1.75;
        const width = isMobile ? '3.2rem' : '3.5rem';
        const height = isMobile ? '4.0rem' : '4.2rem';
        const xRem = (tile.x - centerX) * spacingX;
        const yRem = tile.y * spacingY;
        return {
            left: `calc(50% - ${halfWidth}rem + ${xRem}rem + ${pxShift}px)`, top: `calc(${yRem}rem + ${pxShift}px)`,
            zIndex: tile.z * 100 + tile.y,
            width,
            height
        };
    }, [isMobile, centerX]);
    const getBestForProfile = (p: 'el' | 'ella') => {
        const scores = leaderboard[p];
return scores.length > 0 ? scores[0] : null;
    };

    const gameWon = matchedCount === tiles.length && tiles.length > 0;

    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">

            <div className="relative z-10 mb-5 flex flex-col w-full gap-4 border border-white/10 bg-black/60 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col items-start">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#a88a7e]">
                            <Layers3 className={`h-4 w-4 text-${accentClass}`} style={{ color: accentColor }} />
                            Tablero Activo: {LAYOUT_INFO[currentLayout]?.name || currentLayout}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(LAYOUT_INFO) as LayoutType[]).map((layout) => (
                                <button
                                    key={layout}
                                    onClick={() => {
                                        setCurrentLayout(layout);
                                        initializeGame(layout);
                                    }}
                                    className={`!min-h-0 px-2.5 py-1 text-[8px] font-mono font-bold uppercase border transition-all ${
                                        currentLayout === layout
                                            ? `bg-${accentClass} text-black border-${accentClass}`
                                            : 'bg-[#0a0a0a] text-[#a88a7e] border-white/10 hover:border-white/20'
                                    }`}
                                    style={currentLayout === layout ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                                >
                                    {LAYOUT_INFO[layout].name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-stretch gap-3">
                            <MahjongTimer isActive={timerActive} formatTime={formatTime} ref={timerRef} />
                            <div className="relative flex min-w-32 flex-col items-center border border-white/10 bg-black/70 px-5 py-3">
                                <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Pares</span>
                                <div className="flex items-baseline gap-1 font-mono tracking-normal">
                                    <span className={`text-3xl font-bold tabular-nums text-${accentClass}`} style={{ color: accentColor }}>{matchedCount}</span>
                                    <span className="text-xs text-white/40">/ {tiles.length}</span>
                                </div>
                                <div className={`absolute bottom-0 right-0 h-2 w-2 border-b border-r border-${accentClass}/50`} style={{ borderColor: `${accentColor}80` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleUndo}
                                disabled={undoStack.length === 0}
                                className={`flex min-h-12 items-center justify-center gap-2 border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a88a7e] transition-colors hover:border-${accentClass} hover:text-white active:scale-95 disabled:opacity-35`}
                                title="Deshacer"
                            >
                                <Undo2 className="h-4 w-4" /> <span className="hidden sm:inline">Deshacer</span>
                            </button>
                            <button
                                onClick={handleHint}
                                className={`flex min-h-12 items-center justify-center gap-2 border border-${accentClass}/50 bg-${accentClass}/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-${accentClass} hover:text-black active:scale-95`}
                                style={{ borderColor: `${accentColor}80`, backgroundColor: `${accentColor}1a`, color: accentColor }}
                                title="Pista"
                            >
                                <Lightbulb className="h-4 w-4" /> <span className="hidden sm:inline">Pista</span>
                            </button>
                            <button
                                onClick={handleRestart}
                                className={`flex min-h-12 items-center justify-center gap-2 border border-${accentClass} bg-${accentClass} px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-black transition-all hover:opacity-80 active:scale-95`}
                                style={{ borderColor: accentColor, backgroundColor: accentColor }}
                                title="Reiniciar"
                            >
                                <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Reiniciar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isLoaded && (
                <div className="relative z-20 mb-6 w-full max-w-lg">
                    <div className="relative flex min-h-[5.5rem] items-center justify-center gap-3 border border-white/10 bg-black/70 p-3">
                        <div className="absolute left-3 top-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#a88a7e]">
                            <Sparkles className={`h-3 w-3 text-${accentClass}`} style={{ color: accentColor }} />
                            Dock
                        </div>
                        {[0, 1, 2].map((idx) => {
                            const dId = dockIds[idx];
                            const tile = dId ? tilesById.get(dId) : null;
                            const isShattering = dId && shatteringTiles.has(dId);

                            return (
                                <div key={idx} className="relative flex h-18 w-14 items-center justify-center border border-dashed border-white/15 bg-[#050505] md:h-20 md:w-16">
                                    {tile && !isShattering && (
                                        <motion.div
                                            layoutId={tile.id}
                                            className="flex h-full w-full items-center justify-center overflow-hidden rounded-none border border-r-[3px] border-b-[4px] border-[#4b403a] bg-[#111] shadow-none"
                                        >
                                            <TileVisual tile={tile} />
                                        </motion.div>
                                    )}

                                    {isShattering && tile && (
                                        <div className="absolute inset-0 z-50 pointer-events-none">
                                            <div className="shatter-container" style={{ '--ripple-color': accentColor } as React.CSSProperties}>
                                                <div className="ripple-wave" />
                                                <div className="ripple-core" />
                                                <div className="shard shard-top"><TileVisual tile={tile} /></div>
                                                <div className="shard shard-right"><TileVisual tile={tile} /></div>
                                                <div className="shard shard-bottom"><TileVisual tile={tile} /></div>
                                                <div className="shard shard-left"><TileVisual tile={tile} /></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {gameLost && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-[100099] flex w-[90%] max-w-md flex-col items-center border border-red-500 bg-black/95 px-8 py-10 shadow-[0_0_40px_rgba(239,68,68,0.22)] backdrop-blur-xl md:px-12 md:py-12"
                >
                    <div className="mb-6 flex h-16 w-16 rotate-45 items-center justify-center border border-red-500 bg-red-500/10">
                        <RotateCcw className="h-8 w-8 -rotate-45 text-red-400" />
                    </div>
                    <h3 className="mb-2 text-3xl font-black uppercase tracking-normal text-white md:text-4xl">Sin Espacio</h3>
                    <p className="mb-8 text-center text-sm font-light tracking-normal text-[#a88a7e]">Tu bandeja se ha llenado con cartas sin emparejar.</p>
                    <button
                        onClick={handleRestart}
                        className="w-full bg-red-500 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-600"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={handleUndo}
                        className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a88a7e] transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <Undo2 className="h-4 w-4" /> Deshacer
                    </button>
                </motion.div>
            )}

            {gameWon && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`z-[1000] flex w-[90%] max-w-md flex-col items-center border border-${accentClass} bg-black/95 px-8 py-10 shadow-none backdrop-blur-xl md:px-12 md:py-12`}
                    style={{ borderColor: accentColor, boxShadow: `0 0 44px ${accentColor}2e` }}
                >
                    <div className="mb-5 flex h-16 w-16 rotate-45 items-center justify-center border-2 border-current" style={{ color: accentColor }}>
                        <Trophy className="h-8 w-8 -rotate-45 text-current" />
                    </div>
                    <h3 className="mb-2 text-3xl font-black uppercase tracking-normal md:text-4xl" style={{ color: accentColor }}>¡Triunfo!</h3>
                    <p className="mb-6 text-center text-sm font-light tracking-normal text-[#a88a7e]">Has liberado todas nuestras memorias.</p>

                    {isNewRecord && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`mb-4 border border-${accentClass} bg-${accentClass}/10 px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] shadow-none`}
                            style={{ borderColor: accentColor, color: profile === 'ella' ? '#ffb595' : '#e1ff80' }}
                        >
                            NUEVO RÉCORD
                        </motion.div>
                    )}

                    <div className="relative mb-6 w-full border border-white/10 bg-[#050505] p-4">
                        <div className="text-center">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tu Tiempo</span>
                            <span className="font-mono text-3xl tracking-normal text-white">{formatTime(timerRef.current?.getTime() || 0)}</span>
                            <span className={`mt-1 block text-[10px] font-bold uppercase ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>
                                {profile === 'el' ? 'Santiago' : 'Mile'}
                            </span>
                        </div>
                    </div>

                    {(leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                        <div className="w-full mb-6">
                            <h4 className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tabla de Récords</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-a">Él</span>
                                    {leaderboard.el.length > 0 ? leaderboard.el.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs">
                                            <span className="font-mono text-white/35">#{i + 1}</span>
                                            <span className="font-mono tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-b">Ella</span>
                                    {leaderboard.ella.length > 0 ? leaderboard.ella.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs">
                                            <span className="font-mono text-white/35">#{i + 1}</span>
                                            <span className="font-mono tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { setIsLoaded(false); }} className={`w-full bg-${accentClass} py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:opacity-80`} style={{ backgroundColor: accentColor }}>Jugar de nuevo</button>
                </motion.div>
            )}

            <div
                className="relative flex w-full max-w-[880px] justify-center overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] transition-all duration-200"
                style={{
                    height: `${Math.max(600, (boardSpanY * (isMobile ? 1.8 : 2.2) + (isMobile ? 4.0 : 4.2)) * scale * 16 + 40)}px`
                }}
                ref={containerRef}
            >
                <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-70" />
                <AnimatedBrutalistCorners color={accentColor} size={12} thickness={1.5} />
                
                <div
                    className="relative w-full transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        height: `${(boardSpanY * (isMobile ? 1.8 : 2.2) + (isMobile ? 4.0 : 4.2)) * 16}px`
                    }}
                >
                    <AnimatePresence>
                        {tiles.map(tile => {
                            if (tile.isMatched || dockIds.includes(tile.id)) return null;

                            return (
                                <MahjongTile
                                    key={tile.id}
                                    tile={tile}
                                    isFree={!!freeTilesMap.get(tile.id)}
                                    onPointerDown={handleTilePointerDown}
                                    positionStyle={getTileStyle(tile)}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {Array.from(shatteringTiles.entries()).map(([tileId, { tile, dockIndex }]) => {
                        if (dockIndex !== undefined) return null;
                        const pos = getTileStyle(tile);
                        return (
                            <div
                                key={`shatter-${tileId}`}
                                style={{
                                    position: 'absolute',
                                    ...pos,
                                    zIndex: pos.zIndex + 200,
                                }}
                                className="tile-item pointer-events-none"
                            >
                                <div className="shatter-container" style={{ '--ripple-color': accentColor } as React.CSSProperties}>
                                    <div className="ripple-wave" />
                                    <div className="ripple-core" />
                                    <div className="shard shard-top"><TileVisual tile={tile} /></div>
                                    <div className="shard shard-right"><TileVisual tile={tile} /></div>
                                    <div className="shard shard-bottom"><TileVisual tile={tile} /></div>
                                    <div className="shard shard-left"><TileVisual tile={tile} /></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
