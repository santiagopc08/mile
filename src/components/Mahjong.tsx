'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, RotateCcw, Lightbulb } from 'lucide-react';
import MahjongTimer, { MahjongTimerHandle } from './MahjongTimer';
import MahjongTile, { TileState, TileContent, TileVisual } from './MahjongTile';

const MAHJONG_UNICODE = [
    "🀀", "🀁", "🀂", "🀃", "🀄", "🀅", "🀆",
    "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
    "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘",
    "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"
];

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
        for (let x = 0; x < width; x += 2) {
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.4 && coords.length < target * 0.6) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }
        for (let z = 1; z < maxLayers; z++) {
            const potential = coords.filter(c => c.z === z - 1);
            potential.forEach(p => {
                if (Math.random() > 0.6 && coords.length < target) {
                    const exists = coords.some(c => c.x === p.x && c.y === p.y && c.z === z);
                    if (!exists) coords.push({ x: p.x, y: p.y, z });
                }
            });
        }
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
    others: { x: number; y: number; z: number }[]
): boolean {
    const topBlocked = others.some(n =>
        n.z - target.z === 1 &&
        Math.abs(n.x - target.x) < 2 &&
        Math.abs(n.y - target.y) < 2
    );
    if (topBlocked) return false;
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
            const freeSlots = pool.filter((target, _idx) => {
                const others = pool.filter(o => o.id !== target.id);
                return isSlotFree(target, others);
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

    const timerRef = useRef<MahjongTimerHandle>(null);
    const [dockIds, setDockIds] = useState<string[]>([]);
    const [gameLost, setGameLost] = useState(false);
    const [undoStack, setUndoStack] = useState<string[][]>([]);
    const [timerActive, setTimerActive] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);
    const [shatteringTiles, setShatteringTiles] = useState<Map<string, { tile: TileState; fragments: ShatterFragment[]; dockIndex?: number }>>(new Map());
    const [isNewRecord, setIsNewRecord] = useState(false);

    const isProcessingRef = useRef(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        StoreService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
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
    }, [matchedCount, tiles.length, timerActive, profile, scoreSaved, currentLayout, leaderboard]);

    const initializeGame = async () => {
        const mobileState = window.innerWidth <= 768;
        const imageUrls = shuffleArray(await StoreService.getMahjongImages());

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

    const freeTilesMap = useMemo(() => {
        const map = new Map<string, boolean>();
        const dockSet = new Set(dockIds);
        const activeTiles = tiles.filter(t => !t.isMatched && !dockSet.has(t.id));
        tiles.forEach(tile => {
            if (tile.isMatched || dockSet.has(tile.id)) {
                map.set(tile.id, false);
                return;
            }
            const isTopCovered = activeTiles.some(n =>
                n.z - tile.z === 1 &&
                Math.abs(n.x - tile.x) < 2 &&
                Math.abs(n.y - tile.y) < 2
            );
            if (isTopCovered) {
                map.set(tile.id, false);
                return;
            }
            const sameLayerRows = activeTiles.filter(n => n.z === tile.z && Math.abs(n.y - tile.y) < 2);
            const hasLeft = sameLayerRows.some(n => tile.x - 2 <= n.x && n.x < tile.x);
            const hasRight = sameLayerRows.some(n => tile.x < n.x && n.x <= tile.x + 2);
            map.set(tile.id, !(hasLeft && hasRight));
        });
        return map;
    }, [tiles, dockIds]);

    const triggerShatter = useCallback((tileA: TileState, tileB: TileState, dockIndex?: number) => {
        const fragments = createShatterFragments();
        setShatteringTiles(prev => {
            const next = new Map(prev);
            next.set(tileA.id, { tile: tileA, fragments, dockIndex });
            next.set(tileB.id, { tile: tileB, fragments, dockIndex });
            return next;
        });
        setTimeout(() => {
            setShatteringTiles(prev => {
                const next = new Map(prev);
                next.delete(tileA.id);
                next.delete(tileB.id);
                return next;
            });
        }, 1500);
    }, []);

    const handleTilePointerDown = useCallback((id: string) => {
        if (isProcessingRef.current || gameLost) return;
        if (dockIds.includes(id)) return;
        const tile = tiles.find(t => t.id === id);
        if (!tile || tile.isMatched || !freeTilesMap.get(id)) return;
        isProcessingRef.current = true;
        requestAnimationFrame(() => { isProcessingRef.current = false; });
        if (!timerActive && matchedCount < tiles.length) { setTimerActive(true); }
        const matchingDockId = dockIds.find(dId => {
            const dockTile = tiles.find(t => t.id === dId);
            return dockTile && dockTile.content.value === tile.content.value;
        });
        if (matchingDockId) {
            const matchingDockTile = tiles.find(t => t.id === matchingDockId)!;
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
            if (dockIds.length >= 3) {
                setGameLost(true);
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
            } else {
                setDockIds(prev => [...prev, id]);
                setUndoStack(us => [...us, [id]]);
            }
        }
    }, [gameLost, dockIds, tiles, freeTilesMap, timerActive, matchedCount, triggerShatter]);

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

    const handleHint = () => {
        const freeOnBoard = tiles.filter(t => !t.isMatched && !dockIds.includes(t.id) && freeTilesMap.get(t.id));
        for (let i = 0; i < freeOnBoard.length; i++) {
            for (let j = i + 1; j < freeOnBoard.length; j++) {
                if (freeOnBoard[i].content.value === freeOnBoard[j].content.value) {
                    const id1 = freeOnBoard[i].id;
                    const id2 = freeOnBoard[j].id;
                    setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: true } : t));
                    setTimeout(() => {
                        setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: false } : t));
                    }, 2000);
                    return;
                }
            }
        }
        for (const dId of dockIds) {
            const dockTile = tiles.find(t => t.id === dId);
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
    };

    const getTileStyle = useCallback((tile: TileState) => {
        const pxShift = tile.z * -6;
        const spacingX = isMobile ? 1.5 : 2;
        const spacingY = isMobile ? 1.8 : 2.2;
        const halfWidth = isMobile ? 1.6 : 1.75;
        const width = isMobile ? '3.2rem' : '3.5rem';
        const height = isMobile ? '4.0rem' : '4.2rem';
        const xRem = (tile.x - (isMobile ? 5 : 9)) * spacingX;
        const yRem = tile.y * spacingY;
        return {
            left: `calc(50% - ${halfWidth}rem + ${xRem}rem + ${pxShift}px)`, top: `calc(${yRem}rem + ${pxShift}px)`,
            zIndex: tile.z * 100 + tile.y,
            width,
            height
        };
    }, [isMobile]);

    const getBestForProfile = (p: 'el' | 'ella') => {
        const scores = leaderboard[p];
        return scores.length > 0 ? scores[0] : null;
    };

    const gameWon = matchedCount === tiles.length && tiles.length > 0;

    return (
        <div className="w-full flex justify-center items-center flex-col py-8 md:py-12 relative overflow-hidden bg-grid-mosaic">
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

            <div className="w-full max-w-5xl px-6 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 relative z-10">
                <div className="flex flex-col items-center md:items-start">
                    <h2 className="text-4xl md:text-5xl font-black text-stone-800 dark:text-stone-100 uppercase tracking-tighter leading-none mb-1">Memorias</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-geometric-accent" />
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em]">Tablero {currentLayout}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <MahjongTimer isActive={timerActive} formatTime={formatTime} ref={timerRef} />
                    <div className="flex flex-col items-end border-l border-geometric-border pl-4">
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">Emparejados</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-mono font-bold text-geometric-accent tabular-nums">{matchedCount}</span>
                            <span className="text-xs text-stone-400 font-mono">/ {tiles.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-none bg-stone-50 dark:bg-stone-900 border border-geometric-border text-stone-600 dark:text-stone-300 shadow-none disabled:opacity-40 hover:border-geometric-accent transition-colors active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest"
                    >
                        <Undo2 className="w-3 md:w-4 h-3 md:h-4" /> Deshacer
                    </button>
                    <button
                        onClick={handleHint}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-none bg-stone-50 dark:bg-stone-900 border border-geometric-border text-geometric-accent shadow-none hover:border-geometric-accent transition-colors active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest"
                    >
                        <Lightbulb className="w-3 md:w-4 h-3 md:h-4" /> Pista
                    </button>
                    <button
                        onClick={handleRestart}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-none bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border border-stone-900 dark:border-stone-100 shadow-none hover:bg-geometric-accent hover:border-geometric-accent hover:text-white dark:hover:bg-geometric-accent dark:hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest"
                    >
                        <RotateCcw className="w-3 md:w-4 h-3 md:h-4" /> Reiniciar
                    </button>
                </div>
            </div>

            {isLoaded && (
                <div className="w-full max-w-lg px-6 mb-8 relative z-20">
                    <div className="geometric-card bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-3 shadow-none flex justify-center gap-3 min-h-[5.5rem] items-center relative">
                        {[0, 1, 2, 3].map((idx) => {
                            const dId = dockIds[idx];
                            const tile = dId ? tiles.find(t => t.id === dId) : null;
                            const isShattering = dId && shatteringTiles.has(dId) && shatteringTiles.get(dId)?.dockIndex !== undefined;

                            return (
                                <div key={idx} className="w-14 h-18 md:w-16 md:h-20 bg-stone-50 dark:bg-stone-950 rounded-none border border-dashed border-geometric-border flex items-center justify-center relative">
                                    {tile && !isShattering && (
                                        <motion.div
                                            layoutId={tile.id}
                                            className="w-full h-full bg-white dark:bg-stone-800 rounded-none shadow-none border border-geometric-border border-r-[3px] border-b-[4px] flex items-center justify-center overflow-hidden"
                                        >
                                            <TileVisual tile={tile} />
                                        </motion.div>
                                    )}

                                    {isShattering && (
                                        <div className="absolute inset-0 z-50 pointer-events-none">
                                            {shatteringTiles.get(dId!)?.fragments.map((frag) => (
                                                <motion.div
                                                    key={frag.id}
                                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                                                    animate={{
                                                        x: frag.dx * 0.4,
                                                        y: frag.dy * 0.4,
                                                        opacity: 0,
                                                        scale: 0.2,
                                                        rotate: frag.rot
                                                    }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className="absolute inset-0 rounded-none shadow-none"
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
                                                className="absolute inset-0 bg-amber-400/30 blur-sm rounded-none"
                                            />
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
                    className="z-[100099] top-1/4 geometric-card bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl px-8 md:px-12 py-10 md:py-12 border-red-500 dark:border-red-500 shadow-2xl flex flex-col items-center max-w-md w-[90%]"
                >
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-none flex items-center justify-center mb-6 rotate-45">
                        <RotateCcw className="w-8 h-8 text-red-500 -rotate-45" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-100 mb-2 uppercase tracking-tighter">Sin Espacio</h3>
                    <p className="text-stone-500 font-light mb-8 text-center text-sm">Tu bandeja se ha llenado con cartas sin emparejar.</p>
                    <button
                        onClick={handleRestart}
                        className="w-full py-4 rounded-none bg-red-500 text-white font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-colors"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={handleUndo}
                        className="mt-4 w-full py-3 rounded-none border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-xs uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Undo2 className="w-4 h-4" /> Deshacer
                    </button>
                </motion.div>
            )}

            {gameWon && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className=" z-[1000] top-1/4 geometric-card bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl px-8 md:px-12 py-10 md:py-12 border-geometric-accent shadow-2xl flex flex-col items-center max-w-md w-[90%]"
                >
                    <div className="w-16 h-16 border-2 border-geometric-accent flex items-center justify-center mb-5 rotate-45">
                        <Trophy className="w-8 h-8 text-geometric-accent -rotate-45" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-geometric-accent mb-2 uppercase tracking-tighter">¡Triunfo!</h3>
                    <p className="text-stone-500 font-light mb-6 text-center text-sm">Has liberado todas nuestras memorias.</p>

                    {isNewRecord && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-none font-bold text-xs uppercase tracking-[0.2em] mb-4 border border-geometric-accent bg-geometric-accent/10 shadow-none"
                        >
                            🎉 ¡NUEVO RÉCORD! 🎉
                        </motion.div>
                    )}

                    <div className="bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none p-4 w-full mb-6 relative">
                        <div className="text-center">
                            <span className="block text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Tu Tiempo</span>
                            <span className="text-3xl font-mono text-stone-800 dark:text-stone-100">{formatTime(timerRef.current?.getTime() || 0)}</span>
                            <span className={`block text-[10px] mt-1 uppercase font-bold ${profile === 'ella' ? 'text-rose-500' : 'text-amber-500'}`}>
                                {profile === 'el' ? 'Santiago' : 'Mile'}
                            </span>
                        </div>
                    </div>

                    {(leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                        <div className="w-full mb-6">
                            <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-3 text-center">Tabla de Récords</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block text-center">Él</span>
                                    {leaderboard.el.length > 0 ? leaderboard.el.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-none px-3 py-1.5 text-xs border border-geometric-border">
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
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-none px-3 py-1.5 text-xs border border-geometric-border">
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

                    <button onClick={() => { setIsLoaded(false); }} className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3.5 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-geometric-accent dark:hover:bg-geometric-accent dark:hover:text-white transition-all">Jugar de nuevo</button>
                </motion.div>
            )}

            <div className="relative w-full max-w-[800px] min-h-[600px] md:min-h-[700px] flex justify-center">
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

                {Array.from(shatteringTiles.entries()).map(([tileId, { tile, fragments, dockIndex }]) => {
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
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    className="absolute inset-0 rounded-sm shadow-lg"
                                    style={{
                                        clipPath: frag.clipPath,
                                        background: `linear-gradient(${frag.rot}deg, #b8860b, #d4a853, #f5e6c8)`,
                                        border: '1px solid rgba(180, 130, 50, 0.6)',
                                    }}
                                />
                            ))}
                            <motion.div
                                initial={{ opacity: 1, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 3 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="absolute inset-0 bg-amber-400/40 rounded-none blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0.6, scale: 1 }}
                                animate={{ opacity: 0, scale: 2 }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                className="absolute inset-0 ring-2 ring-amber-300/50 rounded-none"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
