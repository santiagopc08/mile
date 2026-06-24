'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { MahjongService } from '@/services/mahjongService';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, RotateCcw, Lightbulb, Layers3, Sparkles, Shield, Mountain } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import MahjongTimer, { MahjongTimerHandle } from './MahjongTimer';
import { TileState, TileContent, TileVisual } from './MahjongTile';
import { MahjongCanvas } from './MahjongCanvas';

const MAHJONG_UNICODE = [
    "🌸", "🐱", "💖", "🍊", "🍀", "🍎", "🐼", "🦊", "🐶", "🐰",
    "🐨", "🌻", "🍓", "🍇", "🥑", "🎈", "✨", "💫", "🧁", "🍩",
    "🎨", "🎮", "🧸", "🍿", "🍕", "🍤", "🍣", "🌮", "🥞", "🍔"
];

type LayoutType = 'turtle' | 'fortress' | 'peaks' | 'random';

const LAYOUT_INFO: Record<LayoutType, { name: string; description: string; tiles: number }> = {
    turtle: { name: 'Tortuga Clásica', description: 'El diseño milenario en pirámide.', tiles: 96 },
    fortress: { name: 'La Fortaleza', description: 'Muros concéntricos de memorias.', tiles: 96 },
    peaks: { name: 'Picos Gemelos', description: 'Dos torres que se encuentran.', tiles: 96 },
    random: { name: 'Caos Equilibrado', description: 'Formación procedimental única.', tiles: 96 }
};

function filterCoordsByColumns(coords: { x: number; y: number; z: number }[], maxCols: number) {
    const uniqueX = Array.from(new Set(coords.map(c => c.x))).sort((a, b) => a - b);
    if (uniqueX.length <= maxCols) return coords;

    const diff = uniqueX.length - maxCols;
    const startIndex = Math.floor(diff / 2);
    const allowedX = new Set(uniqueX.slice(startIndex, startIndex + maxCols));

    const filtered = coords.filter(c => allowedX.has(c.x));

    if (filtered.length % 2 !== 0) {
        let maxZ = -1;
        let indexToRemove = -1;
        for (let i = 0; i < filtered.length; i++) {
            if (filtered[i].z > maxZ) {
                maxZ = filtered[i].z;
                indexToRemove = i;
            }
        }
        if (indexToRemove !== -1) {
            filtered.splice(indexToRemove, 1);
        }
    }
    return filtered;
}

function generateCoordinates(type: LayoutType) {
    const coords: { x: number, y: number, z: number }[] = [];
    const target = LAYOUT_INFO[type].tiles;

    if (type === 'random') {
        const maxLayers = 4;
        const width = 16;  // x will be 0, 2, 4, 6, 8, 10, 12, 14 (8 columns)
        const height = 16; // y will be 0, 2, 4, 6, 8, 10, 12, 14 (8 rows)

        // Generate base layer
        for (let x = 0; x < width; x += 2) {
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.35 && coords.length < target * 0.6) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }

        const coordSet = new Set<string>();
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i];
            coordSet.add(`${c.x},${c.y},${c.z}`);
        }

        // Generate upper layers
        for (let z = 1; z < maxLayers; z++) {
            const potential = coords.filter(c => c.z === z - 1);
            potential.forEach(p => {
                if (Math.random() > 0.5 && coords.length < target) {
                    const key = `${p.x},${p.y},${z}`;
                    if (!coordSet.has(key)) {
                        coordSet.add(key);
                        coords.push({ x: p.x, y: p.y, z });
                    }
                }
            });
        }

        // Fill remaining coordinates to reach exactly `target`
        let fillIdx = 0;
        let safety = 0;
        while (coords.length < target && safety < 3000) {
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

    if (type === 'turtle') {
        // Layer 0: 8x8 without corners
        for (let x = 0; x <= 14; x += 2) {
            for (let y = 0; y <= 14; y += 2) {
                if (!((x === 0 || x === 14) && (y === 0 || y === 14))) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }
        // Layer 1: 6x6
        for (let x = 2; x <= 12; x += 2) {
            for (let y = 2; y <= 12; y += 2) {
                coords.push({ x, y, z: 1 });
            }
        }
        // Layer 2: 4x4
        for (let x = 4; x <= 10; x += 2) {
            for (let y = 4; y <= 10; y += 2) {
                coords.push({ x, y, z: 2 });
            }
        }
        // Layer 3: 2x2
        for (let x = 6; x <= 8; x += 2) {
            for (let y = 6; y <= 8; y += 2) {
                coords.push({ x, y, z: 3 });
            }
        }
        return coords.slice(0, target);
    }

    if (type === 'fortress') {
        // Layer 0: Outer walls
        for (let x = 0; x <= 14; x += 2) {
            for (let y = 0; y <= 14; y += 2) {
                if (x === 0 || x === 14 || y === 0 || y === 14) {
                    coords.push({ x, y, z: 0 });
                }
            }
        }
        // Layer 1: Inner walls
        for (let x = 2; x <= 12; x += 2) {
            for (let y = 2; y <= 12; y += 2) {
                if (x === 2 || x === 12 || y === 2 || y === 12) {
                    coords.push({ x, y, z: 1 });
                }
            }
        }
        // Layer 2: Core walls
        for (let x = 4; x <= 10; x += 2) {
            for (let y = 4; y <= 10; y += 2) {
                if (x === 4 || x === 10 || y === 4 || y === 10) {
                    coords.push({ x, y, z: 2 });
                }
            }
        }
        // Fill core spaces to reach target
        let i = 0;
        const coordSet = new Set(coords.map(c => `${c.x},${c.y},${c.z}`));
        while (coords.length < target && i < 200) {
            const x = 4 + (i % 4) * 2;
            const y = 4 + Math.floor(i / 4) * 2;
            if (x <= 10 && y <= 10) {
                const z = 3;
                const key = `${x},${y},${z}`;
                if (!coordSet.has(key)) {
                    coordSet.add(key);
                    coords.push({ x, y, z });
                }
            }
            i++;
        }
        let j = 0;
        while (coords.length < target && j < 200) {
            const x = 2 + (j % 6) * 2;
            const y = 2 + Math.floor(j / 6) * 2;
            if (x <= 12 && y <= 12) {
                const z = 2;
                const key = `${x},${y},${z}`;
                if (!coordSet.has(key)) {
                    coordSet.add(key);
                    coords.push({ x, y, z });
                }
            }
            j++;
        }
        return coords.slice(0, target);
    }

    // peaks
    // Peak 1: Left-aligned
    for (let x = 0; x <= 6; x += 2) {
        for (let y = 2; y <= 10; y += 2) {
            coords.push({ x, y, z: 0 });
        }
    }
    for (let x = 2; x <= 4; x += 2) {
        for (let y = 4; y <= 8; y += 2) {
            coords.push({ x, y, z: 1 });
        }
    }
    coords.push({ x: 2, y: 6, z: 2 });

    // Peak 2: Right-aligned
    for (let x = 8; x <= 14; x += 2) {
        for (let y = 2; y <= 10; y += 2) {
            coords.push({ x, y, z: 0 });
        }
    }
    for (let x = 10; x <= 12; x += 2) {
        for (let y = 4; y <= 8; y += 2) {
            coords.push({ x, y, z: 1 });
        }
    }
    coords.push({ x: 12, y: 6, z: 2 });

    // Connecting bridges at y = 0 and y = 12
    for (let x = 0; x <= 14; x += 2) {
        coords.push({ x, y: 0, z: 0 });
        coords.push({ x, y: 12, z: 0 });
    }

    const coordSet = new Set<string>();
    const uniqueCoords: { x: number, y: number, z: number }[] = [];
    for (const c of coords) {
        if (c.x >= 0 && c.x <= 14 && c.y >= 0 && c.y <= 14) {
            const key = `${c.x},${c.y},${c.z}`;
            if (!coordSet.has(key)) {
                coordSet.add(key);
                uniqueCoords.push(c);
            }
        }
    }

    let i = 0;
    while (uniqueCoords.length < target && i < 400) {
        const x = 2 + (i % 6) * 2;
        const y = 2 + Math.floor(i / 6) % 6 * 2;
        const z = 2 + Math.floor(Math.floor(i / 6) / 6);
        if (x >= 2 && x <= 12 && y >= 2 && y <= 12 && z < 5) {
            const key = `${x},${y},${z}`;
            if (!coordSet.has(key)) {
                coordSet.add(key);
                uniqueCoords.push({ x, y, z });
            }
        }
        i++;
    }
    return uniqueCoords.slice(0, target);
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

function generateSolvableBoard(rawCoords: { x: number; y: number; z: number }[], pairs: TileContent[]): TileState[] | null {
    const coords = rawCoords.map((c, i) => ({ ...c, id: `tile_${i}` }));
    const finalPairs = pairs.slice(0, coords.length / 2);
    const assignments = new Map<string, TileContent>();
    const availablePairs = [...finalPairs];
    let steps = 0;
    const maxSteps = 40000; // safety limit

    function backtrack(pool: typeof coords): boolean {
        steps++;
        if (steps > maxSteps) return false;
        if (pool.length === 0) return true;

        const grid = new Set<number>();
        for (const t of pool) {
            grid.add(t.z * 10000 + t.y * 100 + t.x);
        }

        const freeSlots = pool.filter(target => isSlotFree(target, grid));
        if (freeSlots.length < 2) return false;

        const freePairs: [number, number][] = [];
        for (let i = 0; i < freeSlots.length; i++) {
            for (let j = i + 1; j < freeSlots.length; j++) {
                freePairs.push([i, j]);
            }
        }

        const shuffledPairs = shuffleArray(freePairs);
        const currentPair = availablePairs.pop();
        if (!currentPair) return false;

        // Try a few pairs of free slots
        // Optimization: limit the branching factor to avoid excessive deep search if we get stuck
        const limitBranch = Math.min(shuffledPairs.length, 6);
        for (let pIdx = 0; pIdx < limitBranch; pIdx++) {
            const [i1, i2] = shuffledPairs[pIdx];
            const slot1 = freeSlots[i1];
            const slot2 = freeSlots[i2];

            assignments.set(slot1.id, currentPair);
            assignments.set(slot2.id, currentPair);

            const nextPool = pool.filter(p => p.id !== slot1.id && p.id !== slot2.id);

            if (backtrack(nextPool)) {
                return true;
            }

            assignments.delete(slot1.id);
            assignments.delete(slot2.id);
        }

        availablePairs.push(currentPair);
        return false;
    }

    const success = backtrack(coords);
    if (success) {
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

export function Mahjong() {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

    const [tiles, setTiles] = useState<TileState[]>([]);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>(() => {
        const layouts: LayoutType[] = ['turtle', 'fortress', 'peaks', 'random'];
        return layouts[Math.floor(Math.random() * layouts.length)];
    });
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
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [isMatchPulse, setIsMatchPulse] = useState(false);
    const [progressParticles, setProgressParticles] = useState<{ id: number; angle: number; speed: number; rotate: number }[]>([]);

    useEffect(() => {
        if (matchedCount > 0) {
            setIsMatchPulse(true);
            const t = setTimeout(() => setIsMatchPulse(false), 400);

            // Spawn 16 wall-breaking fragments (was 10)
            const newParticles = Array.from({ length: 16 }).map((_, i) => ({
                id: Date.now() + i + Math.random(),
                angle: (Math.random() - 0.5) * Math.PI * 0.95,
                speed: 25 + Math.random() * 55, // Faster speed
                rotate: Math.random() * 720
            }));
            setProgressParticles(prev => [...prev, ...newParticles]);
            const timer = setTimeout(() => {
                setProgressParticles(prev => prev.filter(p => !newParticles.includes(p)));
            }, 700);

            return () => {
                clearTimeout(t);
                clearTimeout(timer);
            };
        }
    }, [matchedCount]);

    const isProcessingRef = useRef(false);

    const [memoryModalData, setMemoryModalData] = useState<{
        imageUrl: string;
        title: string;
        description: string;
        date: string;
    } | null>(null);

    const [eventDetailsMap, setEventDetailsMap] = useState<Map<string, { title: string; description: string; date: string }>>(new Map());

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
        const images = await MahjongService.getMahjongImages();

        // Registrar metadatos de recuerdos de Supabase
        const detailsMap = new Map<string, { title: string; description: string; date: string }>();
        for (const img of images) {
            if (img.source === 'supabase' && img.url) {
                detailsMap.set(img.url, {
                    title: img.title || 'Recuerdo Especial',
                    description: img.description || 'Un hermoso recuerdo de nuestra historia.',
                    date: img.date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(img.date)) : 'Fecha especial'
                });
            }
        }
        setEventDetailsMap(detailsMap);

        const fetchedImages: { url: string, source: 'supabase' | 'local', title?: string, description?: string, date?: string }[] = shuffleArray(images);

        let selectedLayout = layoutParam || currentLayout;
        if (!selectedLayout) {
            const layouts: LayoutType[] = ['turtle', 'fortress', 'peaks', 'random'];
            selectedLayout = layouts[Math.floor(Math.random() * layouts.length)];
        }
        setCurrentLayout(selectedLayout);

        const tilesCount = LAYOUT_INFO[selectedLayout].tiles;
        const pairsCount = tilesCount / 2;
        const pairs: TileContent[] = [];
        for (let i = 0; i < Math.min(fetchedImages.length, pairsCount); i++) {
            const img = fetchedImages[i];
            pairs.push({
                type: img.source === 'supabase' ? 'custom' : 'local_image',
                value: img.url
            });
        }
        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: MAHJONG_UNICODE[emojiIdx % MAHJONG_UNICODE.length] });
            emojiIdx++;
        }
        let rawCoords = generateCoordinates(selectedLayout);
        if (mobileState) {
            rawCoords = filterCoordsByColumns(rawCoords, 8);
        }
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
            setTiles(prev => prev.map(t => {
                if (t.id === matchingDockTile.id || t.id === tile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            }));

            // Si es un recuerdo de Supabase (dorado), pausar temporizador y mostrar modal
            if (tile.content.type === 'custom') {
                const eventInfo = eventDetailsMap.get(tile.content.value);
                setTimerActive(false); // Pausar temporizador
                setTimeout(() => {
                    setMemoryModalData({
                        imageUrl: tile.content.value,
                        title: eventInfo?.title || 'Recuerdo Especial',
                        description: eventInfo?.description || 'Un hermoso recuerdo de nuestra historia.',
                        date: eventInfo?.date || 'Fecha especial'
                    });
                }, 800);
            }
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
    }, [tilesById, gameLost, dockIds, tiles, freeTilesMap, timerActive, matchedCount, eventDetailsMap]);

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

    const getBestForProfile = (p: 'el' | 'ella') => {
        const scores = leaderboard[p];
        return scores.length > 0 ? scores[0] : null;
    };

    const gameWon = matchedCount === tiles.length && tiles.length > 0;

    const percent = tiles.length > 0 ? (matchedCount / tiles.length) * 100 : 0;
    const filledSegments = Math.round((percent / 100) * 24);

    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden max-md:overflow-visible">

            <div className="relative z-10 mb-4 flex items-center justify-center border border-white/10 bg-black/60 p-4 w-full">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-[#a88a7e]">
                    {currentLayout === 'turtle' && <Layers3 className="h-5 w-5" style={{ color: accentColor }} />}
                    {currentLayout === 'fortress' && <Shield className="h-5 w-5" style={{ color: accentColor }} />}
                    {currentLayout === 'peaks' && <Mountain className="h-5 w-5" style={{ color: accentColor }} />}
                    {currentLayout === 'random' && <Sparkles className="h-5 w-5" style={{ color: accentColor }} />}
                    <span>Tablero: {LAYOUT_INFO[currentLayout]?.name || currentLayout}</span>
                </div>
            </div>

            {gameLost && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
                    {/* Cyber scanlines */}
                    <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                    {/* Figuras desenfocadas de fondo (Glow) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-red-600/25 blur-[100px] animate-bg-glow-float-1" />
                        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-stone-900/50 blur-[100px] animate-bg-glow-float-2" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-900/15 blur-[90px] animate-bg-glow-rotate" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex w-[95%] max-w-md flex-col items-center border border-red-500 bg-black/95 px-8 py-10 shadow-[0_0_40px_rgba(239,68,68,0.22)] backdrop-blur-xl md:px-12 md:py-12 animate-glitch-container"
                    >
                        {/* Esquinas brutalistas decorativas */}
                        <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-red-500" />
                        <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-red-500" />
                        <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-red-500" />
                        <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-red-500" />

                        <div className="mb-6 flex h-16 w-16 rotate-45 items-center justify-center border border-red-500 bg-red-500/10 animate-glitch-flicker">
                            <RotateCcw className="h-8 w-8 -rotate-45 text-red-400" />
                        </div>
                        <h3 className="mb-2 text-3xl font-black uppercase tracking-normal text-white md:text-4xl animate-glitch-text">Sin Espacio</h3>
                        <p className="mb-8 text-center text-sm font-light tracking-normal text-[#a88a7e]">Tu bandeja se ha llenado con cartas sin emparejar.</p>
                        <button
                            onClick={handleRestart}
                            className="w-full bg-red-500 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-red-600 active:scale-95"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={handleUndo}
                            className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a88a7e] transition-all hover:bg-white/5 hover:text-white active:scale-95"
                        >
                            <Undo2 className="h-4 w-4" /> Deshacer
                        </button>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Modal de Recuerdo Desbloqueado */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {memoryModalData && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-hidden"
                        >
                            {/* Cyber scanlines */}
                            <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                            {/* Figuras desenfocadas de fondo (Glow dorado) */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                                <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-[#ffd700]/12 blur-[100px] animate-bg-glow-float-1" />
                                <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-[#ff00ff]/8 blur-[100px] animate-bg-glow-float-2" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#ffd700]/5 blur-[90px] animate-bg-glow-rotate" />
                            </div>

                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                                className="relative z-10 w-full max-w-lg border border-[#ffd700]/40 bg-[#0a0a0a] p-6 text-center shadow-[0_0_50px_rgba(255,215,0,0.25)] md:p-8 animate-glitch-container"
                            >
                                {/* Esquinas brutalistas doradas */}
                                <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#ffd700]" />
                                <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#ffd700]" />
                                <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#ffd700]" />
                                <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#ffd700]" />

                                <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#ffd700] animate-glitch-text">
                                    <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
                                    Recuerdo Desbloqueado
                                </div>

                                {/* Foto grande con bordes dorados */}
                                <div className="relative mx-auto mb-6 aspect-video max-h-64 overflow-hidden border border-[#ffd700]/30 bg-black/60 p-[3px]">
                                    <img
                                        src={memoryModalData.imageUrl}
                                        alt={memoryModalData.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <h3 className="mb-1 text-2xl font-black uppercase tracking-tight text-white font-mono">
                                    {memoryModalData.title}
                                </h3>

                                <span className="mb-4 block text-[10px] font-mono uppercase text-[#a88a7e]">
                                    {memoryModalData.date}
                                </span>

                                <p className="mb-8 border-y border-white/5 py-4 font-mono text-xs italic leading-relaxed text-[#e5e2e1]">
                                    "{memoryModalData.description}"
                                </p>

                                <button
                                    onClick={() => {
                                        setMemoryModalData(null);
                                        setTimerActive(true); // Reanudar temporizador
                                    }}
                                    className="w-full bg-[#ffd700] py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#ffe57f] active:scale-95"
                                >
                                    Continuar
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {gameWon && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
                    {/* Cyber scanlines */}
                    <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                    {/* Figuras desenfocadas de fondo (Glow con colores dinámicos) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full blur-[100px] animate-bg-glow-float-1" style={{ backgroundColor: `${accentColor}33` }} />
                        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full blur-[100px] animate-bg-glow-float-2" style={{ backgroundColor: `${secondaryColor}22` }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[90px] animate-bg-glow-rotate" style={{ backgroundColor: `${accentColor}15` }} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative z-10 flex w-[95%] max-w-md flex-col items-center border border-${accentClass} bg-black/95 px-8 py-10 shadow-none backdrop-blur-xl md:px-12 md:py-12 animate-glitch-container`}
                        style={{ borderColor: accentColor, boxShadow: `0 0 44px ${accentColor}2e` }}
                    >
                        {/* Esquinas brutalistas decorativas */}
                        <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
                        <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
                        <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
                        <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: accentColor }} />

                        <div className="mb-5 flex h-16 w-16 rotate-45 items-center justify-center border-2 border-current animate-glitch-flicker" style={{ color: accentColor }}>
                            <Trophy className="h-8 w-8 -rotate-45 text-current" />
                        </div>
                        <h3 className="mb-2 text-3xl font-black uppercase tracking-normal md:text-4xl animate-glitch-text" style={{ color: accentColor }}>¡Triunfo!</h3>
                        <p className="mb-6 text-center text-sm font-light tracking-normal text-[#a88a7e]">Has liberado todas nuestras memorias.</p>

                        {/* Video de Victoria */}
                        <div className="relative w-full mb-6 aspect-video overflow-hidden border border-white/10 bg-black/60 p-[3px]" style={{ borderColor: `${accentColor}40`, boxShadow: `0 0 15px ${accentColor}15` }}>
                            {/* Esquinas brutalistas decorativas */}
                            <div className="absolute top-0 left-0 h-2 w-2 border-t border-l" style={{ borderColor: accentColor }} />
                            <div className="absolute top-0 right-0 h-2 w-2 border-t border-r" style={{ borderColor: accentColor }} />
                            <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l" style={{ borderColor: accentColor }} />
                            <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r" style={{ borderColor: accentColor }} />

                            <video
                                src="/vid/mahjong_victory.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="h-full w-full object-cover"
                            />
                        </div>

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

                        <button onClick={() => { setIsLoaded(false); }} className={`w-full bg-${accentClass} py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:opacity-80 active:scale-95`} style={{ backgroundColor: accentColor }}>Jugar de nuevo</button>
                    </motion.div>
                </div>,
                document.body
            )}

            <div
                className="relative flex w-full max-w-[880px] max-md:max-w-none max-md:w-screen max-md:shrink-0 h-[690px] max-md:h-[590px] flex-col justify-center overflow-hidden border border-white/10 max-md:border-x-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] transition-all duration-200"
                ref={containerRef}
            >
                <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-70" />
                <AnimatedBrutalistCorners color={accentColor} size={12} thickness={1.5} />

                {/* --- 3D BRUTALIST HUD: TIMER (TOP LEFT OF DOCK) --- */}
                <div className="absolute top-[50px] right-[calc(50%+100px)] md:top-[62px] md:right-[calc(50%+155px)] left-auto z-20">
                    <MahjongTimer isActive={timerActive} formatTime={formatTime} ref={timerRef} accentColor={accentColor} />
                </div>

                {/* --- 3D BRUTALIST HUD: PAIR COUNTER (TOP RIGHT OF DOCK) --- */}
                <div className="absolute top-[50px] left-[calc(50%+100px)] md:top-[62px] md:left-[calc(50%+155px)] right-auto z-20 select-none group">
                    {/* 3D shadow/extrusion */}
                    <div
                        className="absolute inset-0 translate-x-[3px] translate-y-[3px] border-2 border-black transition-transform duration-200"
                        style={{ backgroundColor: accentColor }}
                    />
                    {/* Foreground container */}
                    <div
                        className={`relative flex items-center gap-1.5 md:gap-2 border-2 border-white bg-[#0a0a0a] px-2 py-1 md:px-3.5 md:py-2 transition-all duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] ${isMatchPulse ? 'scale-105' : 'scale-100'
                            }`}
                        style={{
                            boxShadow: isMatchPulse ? `0 0 15px ${accentColor}80` : 'none'
                        }}
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mb-0.5">Parejas</span>
                            <div className="flex items-baseline gap-1 font-mono tracking-normal">
                                <span className="text-xs md:text-sm font-black tabular-nums text-white">
                                    {Math.floor(matchedCount / 2)}
                                </span>
                                <span className="text-[9px] md:text-[10px] text-white/40">/ {Math.floor(tiles.length / 2)}</span>
                            </div>
                        </div>
                        <Trophy
                            className={`h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-300 ${isMatchPulse ? 'rotate-12 scale-125' : 'rotate-0'}`}
                            style={{ color: accentColor }}
                        />
                    </div>
                </div>

                {/* --- 3D BRUTALIST HUD: ACTIONS (BOTTOM CENTER, BELOW PROGRESS BAR) --- */}
                <div className="absolute bottom-[8px] md:bottom-[12px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-3">
                    {/* Undo Button */}
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="relative group select-none disabled:opacity-30 disabled:pointer-events-none"
                        title="Deshacer"
                    >
                        <div
                            className="absolute inset-0 translate-x-[2px] translate-y-[2px] border border-black transition-transform duration-200"
                            style={{ backgroundColor: undoStack.length > 0 ? accentColor : '#333' }}
                        />
                        <div className="relative flex items-center gap-1 border border-white/30 bg-[#0c0c0e] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white transition-transform duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-active:translate-x-[1px] group-active:translate-y-[1px]">
                            <Undo2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-45" />
                            <span className="hidden sm:inline">Deshacer</span>
                        </div>
                    </button>

                    {/* Help/Hint Button */}
                    <button
                        onClick={handleHint}
                        className="relative group select-none"
                        title="Pista"
                    >
                        <div
                            className="absolute inset-0 translate-x-[2px] translate-y-[2px] border border-black transition-transform duration-200"
                            style={{ backgroundColor: accentColor }}
                        />
                        <div className="relative flex items-center gap-1 border border-white/30 bg-[#0c0c0e] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white transition-transform duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-active:translate-x-[1px] group-active:translate-y-[1px]">
                            <Lightbulb className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-115 group-hover:text-yellow-300" />
                            <span className="hidden sm:inline">Pista</span>
                        </div>
                    </button>

                    {/* Restart Button */}
                    <button
                        onClick={handleRestart}
                        className="relative group select-none"
                        title="Reiniciar"
                    >
                        <div
                            className="absolute inset-0 translate-x-[2px] translate-y-[2px] border border-black transition-transform duration-200"
                            style={{ backgroundColor: accentColor }}
                        />
                        <div className="relative flex items-center gap-1 border border-white/30 bg-[#0c0c0e] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white transition-transform duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-active:translate-x-[1px] group-active:translate-y-[1px]">
                            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
                            <span className="hidden sm:inline">Reiniciar</span>
                        </div>
                    </button>
                </div>

                {/* --- VIDEO PROGRESS BAR AT THE BOTTOM ("BREAKING THE WALL") --- */}
                <div className="absolute bottom-[44px] md:bottom-[52px] left-1/2 -translate-x-1/2 w-[220px] md:w-[300px] h-[3px] bg-white/10 z-20 flex items-center select-none font-mono">
                    {/* Glowing active progress line segment */}
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 origin-left"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 10px ${accentColor}, 0 0 4px ${accentColor}`
                        }}
                    />

                    {/* Interactive Arrow Head Tracker */}
                    <motion.div
                        className="absolute pointer-events-none top-1/2"
                        initial={{ left: 0 }}
                        animate={{ left: `${percent}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        style={{ x: '-50%', y: '-50%' }}
                    >
                        <div className="relative flex items-center justify-center">
                            {/* Futuristic Dart/Arrow Head (Slightly larger w-4.5 h-4.5) */}
                            <svg
                                viewBox="0 0 10 10"
                                className="w-4.5 h-4.5 fill-current drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]"
                                style={{ color: '#ffffff' }}
                            >
                                <path d="M2 1.5 L8 5 L2 8.5 L4 5 Z" />
                            </svg>

                            {/* Breaking Wall Particles emitted from the tip of the arrow */}
                            {progressParticles.map((p) => (
                                <motion.div
                                    key={p.id}
                                    className="absolute pointer-events-none rounded-sm"
                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1.3, rotate: 0 }}
                                    animate={{
                                        x: Math.cos(p.angle) * p.speed,
                                        y: Math.sin(p.angle) * p.speed,
                                        opacity: 0,
                                        scale: 0,
                                        rotate: p.rotate
                                    }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    style={{
                                        width: p.id % 2 === 0 ? '6px' : '4px',
                                        height: p.id % 2 === 0 ? '6px' : '4px',
                                        backgroundColor: accentColor,
                                        boxShadow: `0 0 5px ${accentColor}`
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                <MahjongCanvas
                    tiles={tiles}
                    freeTilesMap={freeTilesMap}
                    dockIds={dockIds}
                    onTilePointerDown={handleTilePointerDown}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
}
