'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Shuffle, Trophy, Clock } from 'lucide-react';

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
    const clips = [
        'polygon(0% 0%, 50% 30%, 0% 60%)',
        'polygon(50% 30%, 100% 0%, 100% 50%)',
        'polygon(0% 60%, 50% 30%, 50% 100%)',
        'polygon(50% 30%, 100% 50%, 50% 100%)',
        'polygon(0% 0%, 50% 30%, 100% 0%)',
        'polygon(0% 60%, 50% 100%, 100% 50%, 50% 30%)',
    ];
    return clips.map((clipPath, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200,
        rot: Math.random() * 360 - 180,
        clipPath,
    }));
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
        let i = 0;
        while (coords.length < 144) { coords.push({ x: 2 + (i % 8) * 2, y: 0, z: 1 }); i++; }
    }
    
    return coords.slice(0, isMobile ? 72 : 144); 
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

export function Mahjong() {
    const { profile } = useProfile();
    const [tiles, setTiles] = useState<TileState[]>([]);
    const [undoStack, setUndoStack] = useState<[string, string][]>([]);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>('turtle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    
    // Timer state
    const [time, setTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);

    // Shatter state: tiles waiting for shatter animation before removal
    const [shatteringTiles, setShatteringTiles] = useState<Map<string, { tile: TileState; fragments: ShatterFragment[] }>>(new Map());

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load leaderboard on mount
    useEffect(() => {
        StoreService.getMahjongLeaderboard().then(setLeaderboard).catch(() => {});
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
            // Save to DB
            if (profile && !scoreSaved) {
                setScoreSaved(true);
                StoreService.saveMahjongScore(
                    profile as 'el' | 'ella',
                    time,
                    currentLayout,
                    tiles.length
                ).then(() => {
                    StoreService.getMahjongLeaderboard().then(setLeaderboard).catch(() => {});
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

        const fullDeck = [...pairs, ...pairs];
        const shuffledDeck = shuffleArray(fullDeck);
        const rawCoords = generateCoordinates(selectedLayout, mobileState);

        const initialTiles: TileState[] = rawCoords.map((coord, idx) => ({
            id: `tile_${idx}`,
            x: coord.x,
            y: coord.y,
            z: coord.z,
            content: shuffledDeck[idx],
            isMatched: false,
            isSelected: false
        }));

        setTiles(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setTime(0);
        setTimerActive(false);
        setScoreSaved(false);
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
        if (!T || T.isMatched) return false;

        const unmatchedTiles = currentTiles.filter(t => !t.isMatched && t.id !== targetId);

        // Top Check (Z-Axis)
        const isTopCovered = unmatchedTiles.some(n => 
            n.z - T.z === 1 && 
            Math.abs(n.x - T.x) < 2 && 
            Math.abs(n.y - T.y) < 2
        );

        if (isTopCovered) return false;

        // Lateral Check (X-Axis)
        const sameLayerRows = unmatchedTiles.filter(n => n.z === T.z && Math.abs(n.y - T.y) < 2);
        const hasLeft = sameLayerRows.some(n => T.x - 2 <= n.x && n.x < T.x);
        const hasRight = sameLayerRows.some(n => T.x < n.x && n.x <= T.x + 2);

        if (hasLeft && hasRight) return false;

        return true;
    };

    const triggerShatter = useCallback((tile1: TileState, tile2: TileState) => {
        const newMap = new Map(shatteringTiles);
        newMap.set(tile1.id, { tile: tile1, fragments: createShatterFragments() });
        newMap.set(tile2.id, { tile: tile2, fragments: createShatterFragments() });
        setShatteringTiles(newMap);

        // Remove shatter fragments after animation completes
        setTimeout(() => {
            setShatteringTiles(prev => {
                const next = new Map(prev);
                next.delete(tile1.id);
                next.delete(tile2.id);
                return next;
            });
        }, 600);
    }, [shatteringTiles]);

    const handleTileClick = (id: string) => {
        if (!isTileFree(id)) return;
        
        if (!timerActive && matchedCount < tiles.length) {
            setTimerActive(true);
        }

        const clickedId = id;
        const selectedTile = tiles.find(t => t.isSelected && !t.isMatched);

        if (selectedTile && selectedTile.id === clickedId) {
            setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, isSelected: false } : t));
            return;
        }

        if (selectedTile) {
            const clickedTile = tiles.find(t => t.id === clickedId)!;
            
            if (selectedTile.content.value === clickedTile.content.value) {
                setUndoStack(us => [...us, [selectedTile.id, clickedTile.id]]);
                setMatchedCount(mc => mc + 2);
                
                // Trigger the shatter animation
                triggerShatter(selectedTile, clickedTile);
                
                setTiles(prev => prev.map(t => {
                    if (t.id === selectedTile.id || t.id === clickedTile.id) {
                        return { ...t, isMatched: true, isSelected: false };
                    }
                    return t;
                }));
            } else {
                setTiles(prev => prev.map(t => {
                    if (t.id === clickedId) return { ...t, isSelected: true };
                    if (t.id === selectedTile.id) return { ...t, isSelected: false };
                    return t;
                }));
            }
        } else {
            setTiles(prev => prev.map(t => t.id === clickedId ? { ...t, isSelected: true } : t));
        }
    };

    const handleSmartShuffle = () => {
        setTiles(prev => {
            const unmatched = prev.filter(t => !t.isMatched);
            const contents = unmatched.map(t => t.content);
            const shuffled = shuffleArray(contents);
            
            let matchedIdx = 0;
            return prev.map(t => {
                if (!t.isMatched) {
                    const newContent = shuffled[matchedIdx++];
                    return { ...t, content: newContent, isSelected: false };
                }
                return t;
            });
        });
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        
        const stackCopy = [...undoStack];
        const [id1, id2] = stackCopy.pop()!;
        setUndoStack(stackCopy);

        setTiles(prev => prev.map(t => {
            if (t.id === id1 || t.id === id2) {
                return { ...t, isMatched: false, isSelected: false };
            }
            return t;
        }));
        setMatchedCount(mc => mc - 2);
    };

    // Helper to compute tile position
    const getTilePosition = (tile: TileState) => {
        const pxShift = tile.z * -6;
        const spacingX = isMobile ? 1.25 : 2;
        const spacingY = isMobile ? 1.5 : 2.2;
        const halfWidth = isMobile ? 1.3 : 1.75;

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
        return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-12 h-12 rounded-full border-4 border-earth-base border-t-transparent animate-spin"/></div></div>;
    }

    const gameWon = matchedCount > 0 && matchedCount === tiles.length;

    return (
        <div className="w-full flex justify-center items-center flex-col py-8 md:py-12 relative overflow-hidden bg-stone-50 dark:bg-stone-950">
            
            {/* Header */}
            <div className="w-full max-w-5xl px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 mb-8 relative z-10">
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
                        onClick={handleSmartShuffle}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-earth-base text-white shadow-md shadow-earth-base/20 hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                        <Shuffle className="w-3 md:w-4 h-3 md:h-4" /> Barajar
                    </button>
                </div>
            </div>

            {/* Victory Overlay */}
            {gameWon && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-50 top-1/4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl px-8 md:px-12 py-10 md:py-12 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col items-center max-w-md w-[90%]"
                >
                    <div className="w-16 h-16 rounded-full bg-earth-base/10 flex items-center justify-center mb-5">
                        <Trophy className="w-8 h-8 text-earth-base" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif italic text-earth-base mb-2">¡Triunfo!</h3>
                    <p className="text-stone-500 font-light mb-6 text-center text-sm">Has liberado todas nuestras memorias.</p>
                    
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
            <div className="relative w-full max-w-[800px] h-[700px] md:h-[600px] flex justify-center">
                <style dangerouslySetInnerHTML={{__html: `
                    @media (max-width: 768px) {
                        .tile-item {
                            width: 2.6rem;
                            height: 3.2rem;
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
                        if (tile.isMatched) return null;

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
                                    ${tile.isSelected 
                                        ? 'bg-amber-100 dark:bg-amber-900/80 ring-2 ring-earth-base shadow-xl shadow-earth-base/20' 
                                        : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 border-r-[3px] border-b-[4px]'}
                                `}
                            >
                                {tile.isSelected && (
                                    <div className="absolute inset-0 ring-3 ring-earth-base/40 rounded-lg animate-pulse pointer-events-none" />
                                )}

                                {tile.content.type === 'custom' ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={tile.content.value} alt="Memory" className="w-full h-full object-cover p-0.5 rounded-md select-none pointer-events-none" />
                                ) : (
                                    <span className={`text-xl md:text-2xl leading-none select-none pointer-events-none ${tile.content.value === '🀄' || tile.content.value === '🀆' ? 'text-red-500' : 'text-stone-800 dark:text-stone-300'}`}>
                                        {tile.content.value}
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Shatter Fragments Layer */}
                {Array.from(shatteringTiles.entries()).map(([tileId, { tile, fragments }]) => {
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
                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                                    animate={{
                                        x: frag.dx,
                                        y: frag.dy,
                                        opacity: 0,
                                        scale: 0.3,
                                        rotate: frag.rot,
                                    }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="absolute inset-0 bg-white dark:bg-stone-600 rounded-sm"
                                    style={{ clipPath: frag.clipPath }}
                                />
                            ))}
                            {/* Central flash */}
                            <motion.div
                                initial={{ opacity: 0.8, scale: 1 }}
                                animate={{ opacity: 0, scale: 2.5 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-0 bg-earth-base/20 rounded-lg blur-sm"
                            />
                        </div>
                    );
                })}
            </div>
            
        </div>
    );
}
