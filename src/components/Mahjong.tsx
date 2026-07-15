'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase as defaultSupabase } from '@/lib/supabase';
import { StoreService } from '@/services/storeService';
import { MahjongService } from '@/services/mahjongService';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, RotateCcw, Lightbulb, Sparkles, Flame } from 'lucide-react';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import MahjongTimer, { MahjongTimerHandle } from './MahjongTimer';
import { TileState, TileContent, TileVisual } from './MahjongTile';
import { MahjongCanvas } from './MahjongCanvas';
import {
    getUnlockedMechanics,
    selectActiveMechanicsForGame,
    applyHardeningToBoard,
    getGhostSolidIds,
    tickBombs,
    processIceOnMatch,
    processLockUnlock,
    clearSmoke,
    triggerNewSmokeBomb,
    applyGravityCollapse,
    HardeningMechanic
} from './hardeningEngine';

const TILESETS: Record<string, { name: string; icon: string; minGames: number; tiles: string[] }> = {
    traditional: {
        name: "Clásico",
        icon: "🀄",
        minGames: 0,
        tiles: [
            "🀀", "🀁", "🀂", "🀃", "🀄", "🀅", "🀆", "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
            "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘", "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟",
            "🀠", "🀡", "🀢", "🀣", "🀤", "🀥", "🀦", "🀧", "🀨", "🀩", "🀪"
        ]
    },
    romance: {
        name: "Amor",
        icon: "💖",
        minGames: 15,
        tiles: [
            "💖", "💝", "💘", "💞", "💟", "💌", "💋", "💍", "🌹", "💐", "🥂", "🍫", "🎈", "🧸", "❤️", "💑",
            "👩‍❤️‍👨", "👰‍♀️", "🤵‍♂️", "🍾", "🧁", "🕯️", "🎁", "✨", "🎀", "🕊️", "💓", "💕", "❤️‍🔥", "💋", "💍", "💖"
        ]
    },
    animals: {
        name: "Animales",
        icon: "🐱",
        minGames: 30,
        tiles: [
            "🐱", "🐶", "🦊", "🐼", "🐨", "🐰", "🐻", "🐯", "🦁", "🐸", "🐵", "🐧", "🐦", "🐤", "🦄", "🐙",
            "🐳", "🐬", "🐝", "🦋", "🐞", "🦕", "🐆", "🦓", "🐘", "🐪", "🦒", "🦘", "🦦", "🦉", "🐢", "🦀"
        ]
    },
    sweets: {
        name: "Dulces",
        icon: "🍰",
        minGames: 45,
        tiles: [
            "🍎", "🍓", "🍊", "🍇", "🍉", "🍌", "🍒", "🍑", "🥑", "🍕", "🍔", "🍟", "🌮", "🍣", "🍤", "🥞",
            "🍩", "🧁", "🍦", "🍧", "🍪", "🍿", "☕️", "🍹", "🍬", "🍭", "🍫", "🍰", "🥧", "🍯", "🍮", "🥐"
        ]
    },
    nature: {
        name: "Naturaleza",
        icon: "🌸",
        minGames: 60,
        tiles: [
            "🌸", "🌻", "🌷", "🌺", "🌼", "🍂", "🍁", "🍀", "🍄", "🌲", "🌴", "🌵", "🌊", "☀️", "🌙", "⭐️",
            "🪐", "💫", "✨", "🌈", "🏔️", "🌋", "🏖️", "🪵", "🌱", "☘️", "🎋", "🍃", "🌬️", "❄️", "⛈️", "☔️"
        ]
    },
    hobbies: {
        name: "Hobbies",
        icon: "🎮",
        minGames: 75,
        tiles: [
            "🎮", "🎲", "🧩", "🎨", "🎭", "🎬", "🎧", "🎤", "🎸", "🎹", "⚽️", "🏀", "🎾", "🏹", "✈️", "⛵️",
            "🛹", "🚲", "🏎️", "🎳", "🎯", "🕹️", "🎰", "🎼", "🎻", "🎷", "🥁", "🧶", "🧵", "🎨", "🎬", "🎧"
        ]
    },
    magic: {
        name: "Magia",
        icon: "🔮",
        minGames: 90,
        tiles: [
            "🔮", "🧿", "🪄", "🧪", "🕯️", "🛸", "🚀", "☄️", "🌟", "⚜️", "🗝️", "🧧", "🏮", "🧙‍♂️", "🧙‍♀️", "🧚‍♂️",
            "🧚‍♀️", "🧞‍♂️", "🧞‍♀️", "🧛‍♂️", "🧛‍♀️", "🧟‍♂️", "🧟‍♀️", "🦄", "🐉", "🐲", "🏰", "📜", "⚗️", "🧪", "🧿", "🔮"
        ]
    },
    cosmic: {
        name: "Espacio",
        icon: "🛸",
        minGames: 105,
        tiles: [
            "🛸", "🚀", "🪐", "🌌", "☄️", "🛰️", "👨‍🚀", "👩‍🚀", "👽", "👾", "🤖", "🌟", "🌍", "📡", "🔭", "🌑",
            "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🪐", "💫", "✨", "🌟", "🌌", "🚀", "🛸", "🌍", "🛰️"
        ]
    },
    app_special: {
        name: "Mieljong",
        icon: "📲",
        minGames: 120,
        tiles: [
            "🍾", "🧠", "🏆", "⏱️", "⏳", "⏰", "🀄", "📅", "💬", "🗺️", "📍", "🏥", "🩺", "🐈‍⬛", "🐈", "💰",
            "💵", "🎂", "🎈", "🏠", "🚪", "🗒️", "✏️", "🌊", "💖", "💝", "🎁", "✨", "🌟", "💫", "🧸",
            "🛡️", "🔑", "🐾", "🐶", "🫙", "🔔", "✈️", "🍽️", "🍿", "🛍️", "🛒", "🎟️", "💊", "🛌", "🏃‍♀️", "🥦",
            "🥛", "🧘‍♀️", "🎮", "🕹️", "🧩", "⚙️", "📈", "🪙", "🍷", "🔋"
        ]
    },
    travel: {
        name: "Viajes",
        icon: "✈️",
        minGames: 135,
        tiles: [
            "✈️", "🛳️", "🚗", "🚲", "🗺️", "📍", "📸", "🗽", "🗼", "🏰", "🏔️", "🏖️", "⛺", "🎒", "🚞", "🚆",
            "🚢", "🛩️", "🚁", "🧳", "🚏", "🗻", "🏜️", "🏝️", "🏕️", "🛖", "🛶", "🚠", "🎢", "🚂"
        ]
    },
    celebration: {
        name: "Fiesta",
        icon: "🎉",
        minGames: 150,
        tiles: [
            "🎉", "🎊", "🎈", "🎂", "🍾", "🥂", "🍹", "🍺", "🍷", "🍕", "🍔", "🍿", "🎭", "💃", "🕺", "🎆",
            "🎇", "🎁", "🕯️", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🎼", "🎤", "🎧", "🎷", "🎸"
        ]
    },
    fruits: {
        name: "Frutas",
        icon: "🍇",
        minGames: 165,
        tiles: [
            "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝",
            "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🍄"
        ]
    },
    mythology: {
        name: "Mitología",
        icon: "🐉",
        minGames: 180,
        tiles: [
            "🐉", "🐲", "🦄", "🧜‍♀️", "🧜‍♂️", "🧚‍♀️", "🧚‍♂️", "🧙‍♀️", "🧙‍♂️", "🧛‍♀️", "🧛‍♂️", "🧟‍♀️", "🧟‍♂️", "🧞‍♀️", "🧞‍♂️",
            "👻", "💀", "👽", "👾", "🤖", "👹", "👺", "🦁", "🦅", "🐺", "🦊", "🐻", "🐼", "🐯", "🐍"
        ]
    },
    sports: {
        name: "Deportes",
        icon: "⚽",
        minGames: 195,
        tiles: [
            "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
            "🏏", "🏹", "🎣", "🥊", "🥋", "🛹", "🛼", "🚴", "🏆", "🥇", "🥈", "🥉", "🎖️", "🎗️"
        ]
    },
    weather: {
        name: "Clima",
        icon: "⚡",
        minGames: 210,
        tiles: [
            "☀️", "🌙", "☁️", "⛅", "⛈️", "🌤️", "🌥️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌀", "🌈",
            "☔", "⚡", "❄️", "🔥", "💧", "🌊", "🍂", "🍁", "🍀", "🌸", "🌻", "🌷", "🍃", "🪵"
        ]
    },
    miel_santi: {
        name: "Miel",
        icon: "🍯",
        minGames: 225,
        tiles: [
            "🍯", "🐻", "🐝", "👩‍❤️‍👨", "💑", "💍", "🏠", "🍾", "🥂", "💖", "💝", "💌", "✨", "🌟", "🎂", "💋",
            "🧸", "🐾", "🐱", "🐶", "🏥", "🩺", "💬", "🗺️", "📍", "🚪", "🗒️", "✏️", "🌊", "🎁"
        ]
    }
};

const getUnlockedTilesForCount = (gamesCount: number) => {
    let tilesPool: string[] = [];
    for (const key in TILESETS) {
        if (TILESETS[key].minGames <= gamesCount) {
            tilesPool = [...tilesPool, ...TILESETS[key].tiles];
        }
    }
    return tilesPool;
};

const getTargetTilesForLevel = (level: number) => {
    const target = 80 + (level - 1) * 8;
    return Math.min(Math.max(80, Math.floor(target / 2) * 2), 96);
};

type LayoutType = 'turtle' | 'fortress' | 'peaks' | 'random';

const LAYOUT_INFO: Record<LayoutType, { name: string; description: string; tiles: number }> = {
    turtle: { name: 'Tortuga', description: 'El diseño milenario en pirámide.', tiles: 96 },
    fortress: { name: 'Fortaleza', description: 'Muros concéntricos de memorias.', tiles: 96 },
    peaks: { name: 'Picos', description: 'Dos torres que se encuentran.', tiles: 96 },
    random: { name: 'Caos', description: 'Formación procedimental única.', tiles: 96 }
};

function filterCoordsByColumns(coords: { x: number; y: number; z: number }[], maxCols: number) {
    // ⚡ Bolt Optimization: Replace coords.map().Set() with single pass O(N) loop
    const uniqueXSet = new Set<number>();
    for (const c of coords) uniqueXSet.add(c.x);
    const uniqueX = Array.from(uniqueXSet).sort((a, b) => a - b);
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

function generateCoordinates(type: LayoutType, target: number) {
    const coords: { x: number, y: number, z: number }[] = [];

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
        for (let z = 0; z < maxLayers; z++) {
            for (let y = 0; y < height; y += 2) {
                for (let x = 0; x < width; x += 2) {
                    if (coords.length >= target) break;
                    const key = `${x},${y},${z}`;
                    if (!coordSet.has(key)) {
                        if (z === 0 || coordSet.has(`${x},${y},${z - 1}`)) {
                            coordSet.add(key);
                            coords.push({ x, y, z });
                        }
                    }
                }
                if (coords.length >= target) break;
            }
            if (coords.length >= target) break;
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
        // ⚡ Bolt Optimization: Replace coords.map().Set() with single pass O(N) loop
        const coordSet = new Set<string>();
        for (const c of coords) coordSet.add(`${c.x},${c.y},${c.z}`);
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
    highest_combo?: number;
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
    const [hasStarted, setHasStarted] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [initialDeal, setInitialDeal] = useState<TileState[] | null>(null);

    const timerRef = useRef<MahjongTimerHandle>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPausedForMessage, setHasPausedForMessage] = useState(false);
    const [dockIds, setDockIds] = useState<string[]>([]);
    const [gameLost, setGameLost] = useState(false);
    const [lostReason, setLostReason] = useState<'dock' | 'bomb' | null>(null);
    const [isReturningFlipped, setIsReturningFlipped] = useState(false);
    const [maxGameCombo, setMaxGameCombo] = useState(0);
    const [undoStack, setUndoStack] = useState<string[][]>([]);
    const [timerActive, setTimerActive] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [isMatchPulse, setIsMatchPulse] = useState(false);
    const [progressParticles, setProgressParticles] = useState<{ id: number; angle: number; speed: number; rotate: number }[]>([]);
    const [completedGamesCount, setCompletedGamesCount] = useState(0);

    // Fire combo streak states
    const [streakCombo, setStreakCombo] = useState(0);
    const [streakTimeRemaining, setStreakTimeRemaining] = useState(0);
    const [comboSign, setComboSign] = useState<{ id: number; text: string } | null>(null);
    const streakTimerRef = useRef<NodeJS.Timeout | null>(null);
    const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Effect for the fire combo countdown
    useEffect(() => {
        if (streakCombo === 0 || streakTimeRemaining <= 0) return;

        streakTimerRef.current = setTimeout(() => {
            setStreakTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time ran out! Fire goes off.
                    setStreakCombo(0);
                    setComboSign(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
        };
    }, [streakCombo, streakTimeRemaining]);

    const triggerStreakCombo = useCallback((newCombo: number) => {
        setStreakCombo(newCombo);
        setMaxGameCombo(prev => Math.max(prev, newCombo));
        
        const duration = 5;
        setStreakTimeRemaining(duration);

        // Gaming signs
        let comboText = "";
        if (newCombo === 1) {
            comboText = "¡CHISPA ENCENDIDA!";
        } else if (newCombo === 2) {
            comboText = "¡BRASA ARDIENTE!";
        } else if (newCombo === 3) {
            comboText = "¡LLAMA ALTA!";
        } else if (newCombo === 4) {
            comboText = "¡LLAMARADA TOTAL!";
        } else if (newCombo === 5) {
            comboText = "¡TABLERO EN LLAMAS!";
        } else {
            comboText = `¡COMBO x${newCombo}!`;
        }

        if (comboTimeoutRef.current) {
            clearTimeout(comboTimeoutRef.current);
        }
        setComboSign({ id: Date.now(), text: comboText });
        comboTimeoutRef.current = setTimeout(() => {
            setComboSign(null);
        }, 1500);
    }, []);

    const resetFireStreak = useCallback(() => {
        setStreakCombo(0);
        setComboSign(null);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
    }, []);

    // ─── Hardening Mechanics State ───────────────────────────────────────────
    const [ghostSolidIds, setGhostSolidIds] = useState<Set<string>>(new Set());
    const ghostElapsedRef = useRef(0);
    const bombTickRef = useRef<NodeJS.Timeout | null>(null);
    const ghostTickRef = useRef<NodeJS.Timeout | null>(null);
    const smokeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const matchCountSinceSmoke = useRef(0);

    const activeTileset = useMemo(() => {
        let activeKey = 'traditional';
        let maxMin = -1;
        for (const key in TILESETS) {
            if (TILESETS[key].minGames <= completedGamesCount && TILESETS[key].minGames > maxMin) {
                maxMin = TILESETS[key].minGames;
                activeKey = key;
            }
        }
        return TILESETS[activeKey];
    }, [completedGamesCount]);

    // Cooperative play and interactive features states
    const [gameMode, setGameMode] = useState<'solo' | 'coop' | 'daily'>('solo');
    const [activeCoopGame, setActiveCoopGame] = useState<any | null>(null);
    const [coopTurn, setCoopTurn] = useState<'el' | 'ella'>('el');
    const [bottleNoteText, setBottleNoteText] = useState('');
    const [bottleNoteModal, setBottleNoteModal] = useState(false);
    const [revealedBottleMessage, setRevealedBottleMessage] = useState<{ id: string; text: string; sender: string } | null>(null);
    const [showMessageText, setShowMessageText] = useState(false);
    const [dailyUnlockedMemory, setDailyUnlockedMemory] = useState<{ title: string; description: string; imageUrl: string; date: string } | null>(null);
    const [pendingReceivedBottle, setPendingReceivedBottle] = useState<any | null>(null);

    // Connection Features states (Message in Bottle & Daily stats)
    const [todayRevealedBottle, setTodayRevealedBottle] = useState<any | null>(null);
    const [allScores, setAllScores] = useState<any[]>([]);
    const [partnerCompletedGames, setPartnerCompletedGames] = useState(0);
    const level = 1 + Math.floor(completedGamesCount / 15);
    const partnerLevel = 1 + Math.floor(partnerCompletedGames / 15);

    const [activeMechanics, setActiveMechanics] = useState<HardeningMechanic[]>([]);

    // Ghost phase timer — toggles every 5 seconds
    useEffect(() => {
        if (!activeMechanics.includes('ghost') || !timerActive) {
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
            return;
        }

        ghostTickRef.current = setInterval(() => {
            ghostElapsedRef.current += 1;
            setGhostSolidIds(getGhostSolidIds(tiles, ghostElapsedRef.current));
        }, 1000);

        return () => {
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
        };
    }, [activeMechanics, timerActive, tiles]);

    // Bomb countdown timer — decrements every second
    useEffect(() => {
        const hasBombs = activeMechanics.includes('bomb') && tiles.some(t => t.isBomb && !t.isMatched && (t.bombTimer ?? 0) > 0);
        if (!hasBombs || !timerActive) {
            if (bombTickRef.current) clearInterval(bombTickRef.current);
            return;
        }

        bombTickRef.current = setInterval(() => {
            setTiles(prev => {
                const { exploded, updatedTiles } = tickBombs(prev);
                if (exploded) {
                    setGameLost(true);
                    setLostReason('bomb');
                    setTimerActive(false);
                    if (bombTickRef.current) clearInterval(bombTickRef.current);
                }
                return updatedTiles;
            });
        }, 1000);

        return () => {
            if (bombTickRef.current) clearInterval(bombTickRef.current);
        };
    }, [activeMechanics, timerActive, tiles]);

    const [dailyPlayRecord, setDailyPlayRecord] = useState<any | null>(null);
    const [dailyStats, setDailyStats] = useState<{ el: any | null; ella: any | null }>({ el: null, ella: null });
    const [todaySentDrawing, setTodaySentDrawing] = useState<any | null>(null);
    const [todayReceivedDrawing, setTodayReceivedDrawing] = useState<any | null>(null);
    const [drawingModalOpen, setDrawingModalOpen] = useState(false);
    const [revealDrawingModalOpen, setRevealDrawingModalOpen] = useState(false);
    const [revealedDrawingData, setRevealedDrawingData] = useState<any | null>(null);
    const [historicDailyStats, setHistoricDailyStats] = useState<{
        el: { completed: number; failed: number; bestTime: number | null };
        ella: { completed: number; failed: number; bestTime: number | null };
    }>({
        el: { completed: 0, failed: 0, bestTime: null },
        ella: { completed: 0, failed: 0, bestTime: null }
    });

    // Subscribe to active coop game changes
    useEffect(() => {
        if (gameMode !== 'coop' || !activeCoopGame) return;

        const channel = defaultSupabase
            .channel(`coop-game-${activeCoopGame.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'coop_games',
                    filter: `id=eq.${activeCoopGame.id}`
                },
                (payload: any) => {
                    const newGame = payload.new;
                    if (newGame) {
                        setTiles(newGame.tiles);
                        setDockIds(newGame.dock_ids || []);
                        setCoopTurn(newGame.active_turn);

                        // Recalculate matched count
                        const matched = newGame.tiles.filter((t: any) => t.isMatched).length;
                        setMatchedCount(matched);

                        if (newGame.completed_at) {
                            setTimerActive(false);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            defaultSupabase.removeChannel(channel);
        };
    }, [gameMode, activeCoopGame]);

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

    const getLocalDateString = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const refreshConnectionFeatures = async () => {
        if (!profile) return;

        // 1. Fetch today's revealed bottle message
        const todayMsg = await MahjongService.getTodayRevealedBottleMessage(profile as 'el' | 'ella');
        setTodayRevealedBottle(todayMsg);

        // 2. Fetch pending received bottle message
        const pendingMsg = await MahjongService.getPendingBottleMessage(profile as 'el' | 'ella');
        setPendingReceivedBottle(pendingMsg);

        // 2. Fetch daily play status & stats
        const dateStr = getLocalDateString();
        const play = await MahjongService.getDailyPuzzlePlay(profile as 'el' | 'ella', dateStr);

        if (play && play.status === 'started') {
            // "started" state means they aborted or reloaded. Update it to "failed" to enforce one-shot rule!
            await MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'failed');
            setDailyPlayRecord({ ...play, status: 'failed' });
        } else {
            setDailyPlayRecord(play);
        }

        // Fetch daily stats and historic stats
        const stats = await MahjongService.getDailyPuzzleStats(dateStr);
        setDailyStats(stats);

        const historic = await MahjongService.getDailyPuzzleHistoricCounts();
        setHistoricDailyStats(historic);

        // Fetch today's drawings
        const sentDrawing = await MahjongService.getTodayDrawing(profile as 'el' | 'ella');
        setTodaySentDrawing(sentDrawing);

        const partnerKey = profile === 'el' ? 'ella' : 'el';
        const receivedDrawing = await MahjongService.getTodayDrawing(partnerKey);
        setTodayReceivedDrawing(receivedDrawing);
    };

    const handleStartDailyGame = async () => {
        requestGameFullscreen();
        if (!profile) return;
        const dateStr = getLocalDateString();
        const success = await MahjongService.startDailyPuzzle(profile as 'el' | 'ella', dateStr);
        if (success) {
            setDailyPlayRecord({ status: 'started' });
            setIsLoaded(false); // Triggers generation
        } else {
            alert('No se pudo iniciar el juego. Tal vez ya lo intentaste hoy.');
        }
    };

    const handleCloseWriteModal = () => {
        setBottleNoteModal(false);
        setBottleNoteText('');
        if (!gameLost && matchedCount < tiles.length) {
            setTimerActive(true);
        }
    };

    useEffect(() => {
        refreshConnectionFeatures();
    }, [profile, gameMode]);

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
        if (profile) {
            MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                .then(setCompletedGamesCount)
                .catch(() => { });

            const partnerProfile = profile === 'el' ? 'ella' : 'el';
            MahjongService.getTotalGamesCompletedCount(partnerProfile)
                .then(setPartnerCompletedGames)
                .catch(() => { });

            MahjongService.getAllMahjongScores()
                .then(setAllScores)
                .catch(() => { });
        }
    }, [profile]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (matchedCount === tiles.length && tiles.length > 0 && timerActive) {
            setTimerActive(false);
            const time = timerRef.current?.getTime() || 0;

            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.completeCoopGame(activeCoopGame.id).then(() => {
                    if (profile) {
                        MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                            .then(setCompletedGamesCount)
                            .catch(() => { });
                    }
                });
                // Send co-op game won notification
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                NotificationService.addNotification(
                    target,
                    'mahjong_coop_won',
                    `¡Despejamos el tablero!: ${authorName} completó el tablero cooperativo. ¡Trabajo en equipo! 💖`
                ).catch(e => console.error(e));
            } else if (gameMode === 'daily') {
                const dateStr = getLocalDateString();
                MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'completed', time)
                    .then(() => {
                        refreshConnectionFeatures();
                        if (profile) {
                            MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                                .then(setCompletedGamesCount)
                                .catch(() => { });
                        }
                    });

                // ALSO save to mahjong_scores as 'daily' layout for leaderboard
                const pKey = profile as 'el' | 'ella';
                const bestScores = leaderboard[pKey] || [];
                const isRecord = bestScores.length === 0 || time < bestScores[0].time_seconds;
                setIsNewRecord(isRecord);

                if (profile && !scoreSaved) {
                    setScoreSaved(true);
                    MahjongService.saveMahjongScore(
                        profile as 'el' | 'ella',
                        time,
                        'daily',
                        tiles.length,
                        maxGameCombo
                    ).then(() => {
                        MahjongService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
                        if (isRecord) {
                            const target = profile === 'el' ? 'ella' : 'el';
                            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                            NotificationService.addNotification(target, 'mahjong_record', `¡Récord Superado!: ${authorName} batió el récord en el Desafío Diario con un tiempo de ${formatTime(time)}! 🏆`).catch(e => console.error(e));
                        }
                    });
                }

                // Send daily puzzle completion notification
                const target = profile === 'el' ? 'ella' : 'el';
                const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                NotificationService.addNotification(
                    target,
                    'daily_completed',
                    `¡${senderName} completó el Desafío Diario en ${formatTime(time)}! 🧠`
                ).catch(e => console.error(e));
            } else {
                const pKey = profile as 'el' | 'ella';

                // ⚡ Bolt Optimization: Calculate best time in single O(N) pass instead of multiple intermediate map/filter arrays
                let bestTimeForLevel: number | null = null;
                for (const score of allScores) {
                    if (score.layout === 'daily' || score.profile !== pKey) continue;

                    let parsedLevel = 1;
                    if (score.layout && score.layout.includes(':')) {
                        parsedLevel = parseInt(score.layout.split(':')[1], 10) || 1;
                    } else {
                        parsedLevel = score.tile_count === 96 ? 3 : score.tile_count === 88 ? 2 : 1;
                    }

                    if (parsedLevel === level) {
                        if (bestTimeForLevel === null || score.time_seconds < bestTimeForLevel) {
                            bestTimeForLevel = score.time_seconds;
                        }
                    }
                }

                const isRecord = bestTimeForLevel === null || time < bestTimeForLevel;
                setIsNewRecord(isRecord);

                if (profile && !scoreSaved) {
                    setScoreSaved(true);
                    MahjongService.saveMahjongScore(
                        profile as 'el' | 'ella',
                        time,
                        `${currentLayout}:${level}`,
                        tiles.length,
                        maxGameCombo
                    ).then(() => {
                        MahjongService.getAllMahjongScores().then(setAllScores).catch(() => { });
                        MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                            .then(setCompletedGamesCount)
                            .catch(() => { });

                        // Notify partner if record at this level
                        if (isRecord) {
                            const target = profile === 'el' ? 'ella' : 'el';
                            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                            NotificationService.addNotification(target, 'mahjong_record', `¡Nuevo Récord de Nivel!: ${authorName} superó su marca en el Nivel ${level} con un tiempo de ${formatTime(time)}! 🏆`).catch(e => console.error(e));
                        }
                    });
                }
            }
        }
    }, [matchedCount, tiles.length, timerActive, profile, scoreSaved, currentLayout, leaderboard, gameMode, activeCoopGame, level, allScores, maxGameCombo]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // ⚡ Bolt Optimization: Calculate board bounds in a single O(N) pass instead of multiple map+Math.max loops
    const { boardSpanX, boardSpanY, centerX } = useMemo(() => {
        if (tiles.length === 0) {
            return { boardSpanX: 18, boardSpanY: 14, centerX: 9 };
        }

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

        return {
            boardSpanX: maxX - minX,
            boardSpanY: maxY - minY,
            centerX: (minX + maxX) / 2
        };
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


    const requestGameFullscreen = () => {
        if (typeof window !== 'undefined') {
            const container = document.documentElement;
            if (container && !document.fullscreenElement) {
                if (typeof container.requestFullscreen === 'function') {
                    container.requestFullscreen().catch(() => {});
                } else if (typeof (container as any).webkitRequestFullscreen === 'function') {
                    (container as any).webkitRequestFullscreen();
                }
            }
        }
    };

    const getDailyEvent = async (signal?: AbortSignal) => {
        try {
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const targetString = `-${month}-${day}`; // e.g. "-06-25"

            const images = await MahjongService.getMahjongImages(undefined, signal);
            const eventImages = images.filter(img => img.source === 'supabase' && img.date);

            // Find match in date string
            let dailyImg = eventImages.find(img => img.date && img.date.includes(targetString));

            // Fallback: if no date matches today, pick a random supabase event image
            if (!dailyImg && eventImages.length > 0) {
                dailyImg = eventImages[Math.floor(Math.random() * eventImages.length)];
            }

            return dailyImg || null;
        } catch (e) {
            console.error('Failed to resolve daily event:', e);
            return null;
        }
    };

    const initializeDailyGame = async (signal?: AbortSignal) => {
        // Fetch daily event
        const dailyEvent = await getDailyEvent(signal);
        const pairs: TileContent[] = [];

        if (dailyEvent) {
            pairs.push({
                type: 'custom',
                value: dailyEvent.url
            });

            // Register details map metadata
            const detailsMap = new Map<string, { title: string; description: string; date: string }>();
            detailsMap.set(dailyEvent.url, {
                title: dailyEvent.title || 'Recuerdo Diario',
                description: dailyEvent.description || 'Un hermoso recuerdo de nuestra historia.',
                date: dailyEvent.date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(dailyEvent.date)) : 'Fecha especial'
            });
            setEventDetailsMap(detailsMap);

            setDailyUnlockedMemory({
                title: dailyEvent.title || 'Recuerdo Diario',
                description: dailyEvent.description || 'Un hermoso recuerdo de nuestra historia.',
                imageUrl: dailyEvent.url,
                date: dailyEvent.date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(dailyEvent.date)) : 'Fecha especial'
            });
        }

        // Special calendar date and time tiles
        const todayObj = new Date();
        const dayStr = String(todayObj.getDate());
        const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const monthStr = monthNames[todayObj.getMonth()];
        const dateValue = `${dayStr} ${monthStr}`;

        const hours = String(todayObj.getHours()).padStart(2, '0');
        const minutes = String(todayObj.getMinutes()).padStart(2, '0');
        const timeValue = `${hours}:${minutes}`;

        pairs.push({
            type: 'calendar_date',
            value: dateValue
        });

        pairs.push({
            type: 'clock_time',
            value: timeValue
        });

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Inject drawing tiles (match every game until 00:00)
        if (todayReceivedDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal'
            });
        }
        if (todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal_own'
            });
        }
        if (!todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'draw'
            });
        }

        // Generate coordinates for daily challenge (64 pairs = 128 tiles on desktop)
        const mobileState = typeof window !== 'undefined' && window.innerWidth <= 768;
        let finalCoords = generateCoordinates('random', 128);
        if (mobileState) {
            finalCoords = filterCoordsByColumns(finalCoords, 8);
            if (finalCoords.length % 2 !== 0) {
                finalCoords = finalCoords.slice(0, finalCoords.length - 1);
            }
        }

        const targetTiles = finalCoords.length;
        const pairsCount = targetTiles / 2;

        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: activeTileset.tiles[emojiIdx % activeTileset.tiles.length] });
            emojiIdx++;
        }

        let initialTiles = generateSolvableBoard(finalCoords, pairs);
        if (!initialTiles) {
            const fullDeck = shuffleArray([...pairs, ...pairs]);
            initialTiles = finalCoords.map((coord, idx) => ({
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

        setTiles(initialTiles);
        setInitialDeal(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setDockIds([]);
        resetFireStreak();
        setGameLost(false);
        setLostReason(null);
        setIsReturningFlipped(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    const handleStartCoopGame = async (selectedLayout: LayoutType) => {
        requestGameFullscreen();
        setIsLoaded(false);
        const mobileState = window.innerWidth <= 768;
        const images = await MahjongService.getMahjongImages();
        const fetchedImages = shuffleArray(images);

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

        const level = 1 + Math.floor(completedGamesCount / 15);
        const tilesCount = getTargetTilesForLevel(level);
        const pairsCount = tilesCount / 2;
        const pairs: TileContent[] = [];

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Fill remaining pairs
        for (let i = 0; i < Math.min(fetchedImages.length, pairsCount - pairs.length); i++) {
            const img = fetchedImages[i];
            pairs.push({
                type: img.source === 'supabase' ? 'custom' : 'local_image',
                value: img.url
            });
        }

        // Mix both players' unlocked tilesets
        const myUnlockedTiles = getUnlockedTilesForCount(completedGamesCount);
        const partnerUnlockedTiles = getUnlockedTilesForCount(partnerCompletedGames);
        const mixedTilesPool = shuffleArray(Array.from(new Set([...myUnlockedTiles, ...partnerUnlockedTiles])));

        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({
                type: 'traditional',
                value: mixedTilesPool[emojiIdx % mixedTilesPool.length]
            });
            emojiIdx++;
        }

        let rawCoords = generateCoordinates(selectedLayout, tilesCount);
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

        const game = await MahjongService.createCoopGame(selectedLayout, initialTiles, profile as 'el' | 'ella');
        if (game) {
            setActiveCoopGame(game);
            setCoopTurn(profile as 'el' | 'ella');
            setTiles(initialTiles);
            setInitialDeal(initialTiles);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            setGameLost(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);
            setIsLoaded(true);
        setHasStarted(false);
        }
    };

    const handleLoadCoopGame = async (game: any, signal?: AbortSignal) => {
        const images = await MahjongService.getMahjongImages(undefined, signal);
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

        setActiveCoopGame(game);
        setTiles(game.tiles);
        setInitialDeal(game.tiles);
        setDockIds(game.dock_ids || []);
        setCoopTurn(game.active_turn);
        setMatchedCount(game.tiles.filter((t: any) => t.isMatched).length);
        setCurrentLayout(game.layout as LayoutType);

        // Check for pending bottle message

        setUndoStack([]);
        setGameLost(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    const initializeGame = async (layoutParam?: LayoutType, signal?: AbortSignal) => {
        if (gameMode === 'coop') {
            const activeGame = await MahjongService.getActiveCoopGame();
            if (activeGame) {
                await handleLoadCoopGame(activeGame, signal);
            } else {
                setActiveCoopGame(null);
                setIsLoaded(true);
        setHasStarted(false);
            }
            return;
        }

        if (gameMode === 'daily') {
            await initializeDailyGame(signal);
            return;
        }

        const mobileState = window.innerWidth <= 768;
        const images = await MahjongService.getMahjongImages(undefined, signal);

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

        const level = 1 + Math.floor(completedGamesCount / 15);
        const tilesCount = getTargetTilesForLevel(level);
        const pairsCount = tilesCount / 2;
        const pairs: TileContent[] = [];

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Inject drawing tiles (match every game until 00:00)
        if (todayReceivedDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal'
            });
        }
        if (todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal_own'
            });
        }
        if (!todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'draw'
            });
        }

        for (let i = 0; i < Math.min(fetchedImages.length, pairsCount - pairs.length); i++) {
            const img = fetchedImages[i];
            pairs.push({
                type: img.source === 'supabase' ? 'custom' : 'local_image',
                value: img.url
            });
        }
        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: activeTileset.tiles[emojiIdx % activeTileset.tiles.length] });
            emojiIdx++;
        }
        let rawCoords = generateCoordinates(selectedLayout, tilesCount);
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
        
        // Flipped-down tiles on the last 5 levels of each 15-game set (indices 10 to 14)
        const isFlippedLevel = (completedGamesCount % 15) >= 10;
        if (isFlippedLevel && initialTiles) {
            initialTiles = initialTiles.map((t, idx) => ({
                ...t,
                isFlippedDown: idx % 2 === 0
            }));
        }

        // Apply hardening mechanics based on level (solo mode only)
        let selectedMechanics: HardeningMechanic[] = [];
        if (initialTiles && gameMode === 'solo') {
            selectedMechanics = selectActiveMechanicsForGame(level);
            initialTiles = applyHardeningToBoard(initialTiles, selectedMechanics, level);
        }
        setActiveMechanics(selectedMechanics);

        setInitialDeal(initialTiles);
        setTiles(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setDockIds([]);
        resetFireStreak();
        // Reset hardening timers
        ghostElapsedRef.current = 0;
        setGhostSolidIds(new Set());
        matchCountSinceSmoke.current = 0;
        if (bombTickRef.current) clearInterval(bombTickRef.current);
        if (ghostTickRef.current) clearInterval(ghostTickRef.current);
        if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
        setMaxGameCombo(0);
        setGameLost(false);
        setLostReason(null);
        setIsReturningFlipped(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    useEffect(() => {
        const abortController = new AbortController();
        if (!isLoaded) { initializeGame(undefined, abortController.signal); }
        return () => abortController.abort();
    }, [isLoaded, gameMode]);

    const { freeTilesMap, tilesById, dockTilesByValue } = useMemo(() => {
        const freeMap = new Map<string, boolean>();
        const idMap = new Map<string, TileState>();
        const dockTilesByValue = new Map<string, TileState>();
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
        for (const id of dockIds) {
            const t = idMap.get(id);
            if (t) dockTilesByValue.set(t.content.value, t);
        }
        return { freeTilesMap: freeMap, tilesById: idMap, dockTilesByValue };
    }, [tiles, dockIds]);


    const handleTilePointerDown = useCallback((id: string) => {
        if (isProcessingRef.current || gameLost || isReturningFlipped) return;
        if (gameMode === 'coop' && activeCoopGame && coopTurn !== profile) return; // lock board actions out of turn
        if (dockIds.includes(id)) return;
        const tile = tilesById.get(id);
        if (!tile || tile.isMatched || !freeTilesMap.get(id)) return;

        // Hardening click blocks
        if (tile.isLocked) return;
        if (tile.iceCounter && tile.iceCounter > 0) return;
        if (tile.isGhost && !ghostSolidIds.has(tile.id)) return;
        if (tile.isSmoked) return;

        // Fullscreen activation when a match is started / played on first tile click
        if (typeof window !== 'undefined') {
            const container = document.documentElement;
            if (container && !document.fullscreenElement) {
                if (typeof container.requestFullscreen === 'function') {
                    container.requestFullscreen().catch(() => {});
                } else if (typeof (container as any).webkitRequestFullscreen === 'function') {
                    (container as any).webkitRequestFullscreen();
                }
            }
        }

        // Memory game mechanic: if we have 2 unmatched flipped-down cards, return them to board
        // ⚡ Bolt Optimization: Replace dockIds.map().find() with a single-pass loop to avoid intermediate array allocation
        let flippedInDock = undefined;
        for (const dId of dockIds) {
            const t = tilesById.get(dId);
            if (t?.isFlippedDown && !t.isMatched) {
                flippedInDock = t;
                break;
            }
        }
        if (tile.isFlippedDown && flippedInDock && flippedInDock.content.value !== tile.content.value) {
            // Add clicked tile to the dock temporarily so player sees it
            const updatedDock = [...dockIds, id];
            setDockIds(updatedDock);
            setIsReturningFlipped(true);

            setTimeout(() => {
                setDockIds(currentDock => currentDock.filter(dId => dId !== id && dId !== flippedInDock.id));
                setIsReturningFlipped(false);
            }, 1000);
            return;
        }

        isProcessingRef.current = true;
        requestAnimationFrame(() => { isProcessingRef.current = false; });
        if (!timerActive && matchedCount < tiles.length) { setTimerActive(true); }

        // ⚡ Bolt Optimization: O(1) dock checks using pre-calculated map
        const matchingDockTile = dockTilesByValue.get(tile.content.value);
        const matchingDockId = matchingDockTile?.id;

        if (matchingDockId && matchingDockTile) {
            let processedTiles = tiles.map(t => {
                if (t.id === matchingDockTile.id || t.id === tile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            });
            const updatedDock = dockIds.filter(did => did !== matchingDockId);

            // ─── Hardening match processing (solo mode) ───
            if (gameMode === 'solo') {
                // Ice: thaw adjacent tiles
                if (activeMechanics.includes('ice')) {
                    processedTiles = processIceOnMatch(processedTiles, tile, matchingDockTile);
                }
                // Padlock: unlock if key pair matched
                if (activeMechanics.includes('padlock')) {
                    processedTiles = processLockUnlock(processedTiles, tile);
                    processedTiles = processLockUnlock(processedTiles, matchingDockTile);
                }
                // Bomb: defuse if bomb tile was matched
                processedTiles = processedTiles.map(t => {
                    if ((t.id === tile.id || t.id === matchingDockTile.id) && t.isBomb) {
                        return { ...t, isBomb: false, bombTimer: undefined };
                    }
                    return t;
                });
                // Gravity: collapse unsupported tiles
                if (activeMechanics.includes('gravity')) {
                    processedTiles = applyGravityCollapse(processedTiles);
                }
                // Smoke: trigger new smoke after every 4 matches
                if (activeMechanics.includes('smoke')) {
                    matchCountSinceSmoke.current += 1;
                    if (matchCountSinceSmoke.current >= 4) {
                        matchCountSinceSmoke.current = 0;
                        const { tiles: smokedTiles } = triggerNewSmokeBomb(processedTiles);
                        processedTiles = smokedTiles;
                        // Clear smoke after 15 seconds
                        if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
                        smokeTimerRef.current = setTimeout(() => {
                            setTiles(prev => clearSmoke(prev));
                        }, 15000);
                    }
                }
            }

            setUndoStack(us => [...us, [matchingDockTile.id, tile.id]]);
            setMatchedCount(mc => mc + 2);
            setDockIds(updatedDock);
            setTiles(processedTiles);

            // Fire streak combo logic
            const nextCombo = streakCombo + 1;
            triggerStreakCombo(nextCombo);

            // Sync to Coop Game in DB & Auto-Turn Pass
            if (gameMode === 'coop' && activeCoopGame) {
                const newMatchedCount = matchedCount + 2;
                const halfMatched = Math.floor(tiles.length / 2);
                if (newMatchedCount === halfMatched) {
                    const nextTurn = coopTurn === 'el' ? 'ella' : 'el';
                    setCoopTurn(nextTurn);
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, nextTurn, profile as 'el' | 'ella');

                    const target = profile === 'el' ? 'ella' : 'el';
                    const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                    NotificationService.addNotification(
                        target,
                        'mahjong_coop_turn',
                        `¡${authorName} completó la mitad del tablero! Tu turno de terminar el juego.`
                    ).catch(console.error);
                    alert(`¡Has completado la mitad del tablero (${halfMatched} fichas)! El turno pasa automáticamente a tu pareja.`);
                } else {
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, coopTurn, profile as 'el' | 'ella');
                }
            }

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

            // Si es un mensaje en la botella (para escribir)
            if (tile.content.type === 'bottle_message') {
                setTimerActive(false); // Pausar
                MahjongService.hasPendingSentMessage(profile as 'el' | 'ella').then((hasPending) => {
                    if (hasPending) {
                        alert('Ya tienes una botella en el océano esperando ser encontrada por tu pareja.');
                        if (!gameLost && matchedCount < tiles.length) {
                            setTimerActive(true);
                        }
                    } else {
                        setBottleNoteModal(true);
                    }
                }).catch(() => {
                    setBottleNoteModal(true);
                });
            }

            // Si es un dibujo especial (drawing_tile)
            if (tile.content.type === 'drawing_tile') {
                setTimerActive(false); // Pausar temporizador
                const actionType = tile.content.value; // 'draw' | 'reveal' | 'reveal_own'
                if (actionType === 'draw') {
                    setDrawingModalOpen(true);
                } else if (actionType === 'reveal') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Milena' : 'Santiago',
                        image: todayReceivedDrawing?.drawing_data,
                        caption: todayReceivedDrawing?.caption || '¡Mira lo que te dibujé! 💖'
                    });
                    setRevealDrawingModalOpen(true);
                } else if (actionType === 'reveal_own') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Santiago' : 'Milena',
                        image: todaySentDrawing?.drawing_data,
                        caption: todaySentDrawing?.caption || 'Tu dibujo de hoy ✨'
                    });
                    setRevealDrawingModalOpen(true);
                }
            }
        } else {
            const updatedDock = [...dockIds, id];
            if (dockIds.length >= 2) {
                setGameLost(true);
                setLostReason('dock');
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                } else if (gameMode === 'daily') {
                    const dateStr = getLocalDateString();
                    MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'failed')
                        .then(() => refreshConnectionFeatures());
                }
            } else {
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                }
            }
        }
    }, [tilesById, gameLost, dockIds, tiles, freeTilesMap, timerActive, matchedCount, eventDetailsMap, gameMode, activeCoopGame, coopTurn, profile, pendingReceivedBottle, isReturningFlipped]);

    const handleRestart = () => {
        if (initialDeal) {
            setTiles([...initialDeal]);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            resetFireStreak();
            
            // Reset hardening timers
            ghostElapsedRef.current = 0;
            setGhostSolidIds(new Set());
            matchCountSinceSmoke.current = 0;
            if (bombTickRef.current) clearInterval(bombTickRef.current);
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
            if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);

            setMaxGameCombo(0);
            setGameLost(false);
            setLostReason(null);
            setIsReturningFlipped(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);

            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.updateCoopGame(activeCoopGame.id, initialDeal, [], coopTurn);
            }
        }
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const lastMove = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, prev.length - 1));
        let updatedTiles = tiles;
        let updatedDock = dockIds;
        if (lastMove.length === 2) {
            const [id1, id2] = lastMove;
            updatedTiles = tiles.map(t =>
                (t.id === id1 || t.id === id2) ? { ...t, isMatched: false, isSelected: false } : t
            );
            setTiles(updatedTiles);
            setMatchedCount(mc => mc - 2);
        } else {
            const [id] = lastMove;
            updatedDock = dockIds.filter(did => did !== id);
            setDockIds(updatedDock);
            setGameLost(false);
        }

        if (gameMode === 'coop' && activeCoopGame) {
            MahjongService.updateCoopGame(activeCoopGame.id, updatedTiles, updatedDock, coopTurn);
        }
    };

    const handleHint = useCallback(() => {
        // ⚡ Bolt Optimization: Use O(1) Set lookup instead of O(M) Array.includes inside an O(N) filter to prevent O(N*M) complexity
        const dockIdsSet = new Set(dockIds);
        const freeOnBoard = tiles.filter(t => !t.isMatched && !dockIdsSet.has(t.id) && freeTilesMap.get(t.id));
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

    const layoutName = gameMode === 'coop' ? 'Cooperativo' : gameMode === 'daily' ? 'Diario' : (LAYOUT_INFO[currentLayout]?.name || currentLayout);

    // ⚡ Bolt Optimization: Replace .filter().map() chain with a single pass O(N) loop to avoid intermediate array allocations
    const parsedLevelScores = useMemo(() => {
        const result = [];
        for (const score of allScores) {
            if (score.layout !== 'daily') {
                let parsedLevel = 1;
                let parsedLayout = score.layout;
                if (score.layout && score.layout.includes(':')) {
                    const parts = score.layout.split(':');
                    parsedLayout = parts[0];
                    parsedLevel = parseInt(parts[1], 10) || 1;
                } else {
                    parsedLevel = score.tile_count === 96 ? 3 : score.tile_count === 88 ? 2 : 1;
                }
                result.push({
                    ...score,
                    parsedLayout,
                    parsedLevel
                });
            }
        }
        return result;
    }, [allScores]);

    const levelComparisons = useMemo(() => {
        if (gameMode !== 'solo') return [];

        const comparisons: {
            levelLabel: string;
            elLvl: number;
            ellaLvl: number;
            elTime: number | null;
            ellaTime: number | null;
            elCombo: number;
            ellaCombo: number;
        }[] = [];

        for (let offset = 0; offset < 3; offset++) {
            const currentWinnerLvl = level - offset;
            if (currentWinnerLvl < 1) break;

            const isWinnerEl = profile === 'el';
            const partnerMaxLvl = partnerLevel;

            let elLvl: number;
            let ellaLvl: number;

            if (isWinnerEl) {
                elLvl = currentWinnerLvl;
                ellaLvl = Math.min(partnerMaxLvl, currentWinnerLvl);
            } else {
                ellaLvl = currentWinnerLvl;
                elLvl = Math.min(partnerMaxLvl, currentWinnerLvl);
            }

            // ⚡ Bolt Optimization: Replace multiple .filter() calls with a single pass O(N) loop
            let elTime: number | null = null;
            let elCombo = 0;
            let ellaTime: number | null = null;
            let ellaCombo = 0;

            for (const s of parsedLevelScores) {
                if (s.profile === 'el' && s.parsedLevel === elLvl) {
                    if (elTime === null || s.time_seconds < elTime) elTime = s.time_seconds;
                    if ((s.highest_combo || 0) > elCombo) elCombo = s.highest_combo || 0;
                } else if (s.profile === 'ella' && s.parsedLevel === ellaLvl) {
                    if (ellaTime === null || s.time_seconds < ellaTime) ellaTime = s.time_seconds;
                    if ((s.highest_combo || 0) > ellaCombo) ellaCombo = s.highest_combo || 0;
                }
            }

            comparisons.push({
                levelLabel: offset === 0 ? 'Nivel Actual' : `Nivel ${currentWinnerLvl}`,
                elLvl,
                ellaLvl,
                elTime,
                ellaTime,
                elCombo,
                ellaCombo
            });
        }

        return comparisons;
    }, [gameMode, level, partnerLevel, profile, parsedLevelScores]);

    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden max-md:overflow-visible">

            {/* Floating gaming brutalist combo sign overlay */}
            <AnimatePresence>
                {comboSign && (
                    <motion.div
                        key={comboSign.id}
                        initial={{ opacity: 0, x: -150, scale: 0.7 }}
                        animate={{ opacity: 1, x: 0, scale: 1.1 }}
                        exit={{ opacity: 0, x: 150, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 11 }}
                        className="fixed top-[14%] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none"
                    >
                        {/* Shadow box */}
                        <div className="absolute inset-0 translate-x-[6px] translate-y-[6px] bg-[#ff4500] border-2 border-black shadow-[0_0_30px_rgba(255,69,0,0.6)]" />
                        {/* Main box */}
                        <div className="relative border-2 border-white bg-black/95 px-8 py-4 text-center">
                            <div className="font-mono text-xs font-black uppercase text-orange-500/70 tracking-widest mb-1 animate-pulse">
                                Racha de Fuego
                            </div>
                            <div className="font-sans font-black text-xl md:text-2xl uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {comboSign.text}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modo de Juego Tab Selector */}
            <div className="flex gap-2 mb-4 bg-black/40 p-1 border border-white/5 font-mono text-[10px] md:text-xs z-10">
                <button
                    onClick={() => {
                        setGameMode('solo');
                        setIsLoaded(false);
                        requestGameFullscreen();
                    }}
                    className={`px-3 py-1.5 transition-all ${gameMode === 'solo' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
                >
                    Solo
                </button>
                <button
                    onClick={async () => {
                        setGameMode('coop');
                        setIsLoaded(false);
                        const activeGame = await MahjongService.getActiveCoopGame();
                        if (activeGame) {
                            handleLoadCoopGame(activeGame);
                        } else {
                            setActiveCoopGame(null);
                        }
                    }}
                    className={`px-3 py-1.5 transition-all ${gameMode === 'coop' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
                >
                    Cooperativo
                </button>
                <button
                    onClick={() => {
                        setGameMode('daily');
                        setIsLoaded(false);
                        requestGameFullscreen();
                    }}
                    className={`px-3 py-1.5 transition-all ${gameMode === 'daily' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
                >
                    Juego Diario
                </button>
            </div>

            <div className="relative z-10 mb-4 flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 w-full gap-3.5">
                {/* Title line combining Level, Tileset, and Layout */}
                <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 text-xs md:text-sm font-black uppercase tracking-[0.15em] text-white font-mono select-none">
                    <span className="text-base md:text-lg select-none mr-0.5" role="img" aria-label={activeTileset.name}>
                        {activeTileset.icon}
                    </span>
                    <span className="text-white/50">LVL</span>
                    <span className="font-black font-sans text-sm md:text-base -ml-1" style={{ color: accentColor }}>
                        {level}
                    </span>
                    <span className="h-3 w-[1px] bg-white/20 mx-1.5" />
                    <span className="font-black font-sans tracking-wider" style={{ color: accentColor }}>
                        {activeTileset.name}
                    </span>
                    <span className="h-3 w-[1px] bg-white/20 mx-1.5" />
                    <span className="font-bold text-[#a88a7e]">
                        {layoutName}
                    </span>

                    {/* Resized and Inline Bottle Tile Button */}
                    {(pendingReceivedBottle || todayRevealedBottle) && (
                        <div className="ml-2.5 flex items-center">
                            {pendingReceivedBottle ? (
                                <button
                                    onClick={() => {
                                        setShowMessageText(false);
                                        setHasPausedForMessage(false);
                                        setRevealedBottleMessage({
                                            id: pendingReceivedBottle.id,
                                            text: pendingReceivedBottle.message,
                                            sender: pendingReceivedBottle.sender === 'el' ? 'Santiago' : 'Milena'
                                        });
                                    }}
                                    className="relative w-8 h-11 overflow-hidden rounded-none border border-r-[2px] border-b-[3px] border-[#4b403a] bg-[#111] hover:brightness-125 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,255,204,0.55)] animate-bounce"
                                    title="Revelar Botella Recibida"
                                >
                                    {/* Geometric corner mark */}
                                    <div className="pointer-events-none absolute right-0 top-0 h-1 w-1 border-r border-t border-[#00ffcc]/60 z-30" />
                                    
                                    <div className="relative h-full w-full overflow-hidden p-[1px] flex items-center justify-center bg-[#0a2323]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#008080] via-[#004d4d] to-[#001a1a] opacity-75"></div>
                                        {/* inner dark bezel */}
                                        <div className="absolute inset-[2px] bg-black z-0"></div>
                                        {/* Bottle emoji */}
                                        <div className="relative z-10 text-sm select-none pointer-events-none animate-pulse">🍾</div>
                                        {/* top glossy shine */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-[#00ffcc]/20 z-20 pointer-events-none"></div>
                                    </div>
                                </button>
                            ) : todayRevealedBottle ? (
                                <button
                                    onClick={() => {
                                        setShowMessageText(false);
                                        setHasPausedForMessage(false);
                                        setRevealedBottleMessage({
                                            id: todayRevealedBottle.id,
                                            text: todayRevealedBottle.message,
                                            sender: todayRevealedBottle.sender === 'el' ? 'Santiago' : 'Milena'
                                        });
                                    }}
                                    className="relative w-8 h-11 overflow-hidden rounded-none border border-r-[2px] border-b-[3px] border-[#4b403a] bg-[#111] hover:brightness-110 transition-all active:scale-95 shadow-[0_0_8px_rgba(0,255,204,0.2)]"
                                    title="Ver Botella Recibida"
                                >
                                    {/* Geometric corner mark */}
                                    <div className="pointer-events-none absolute right-0 top-0 h-1 w-1 border-r border-t border-[#00ffcc]/40 z-30" />
                                    
                                    <div className="relative h-full w-full overflow-hidden p-[1px] flex items-center justify-center bg-[#051515]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d] via-[#003333] to-[#001111] opacity-75"></div>
                                        {/* inner dark bezel */}
                                        <div className="absolute inset-[2px] bg-black z-0"></div>
                                        {/* Bottle emoji */}
                                        <div className="relative z-10 text-sm select-none pointer-events-none opacity-80">🍾</div>
                                        {/* top glossy shine */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-[#00ffcc]/10 z-20 pointer-events-none"></div>
                                    </div>
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Level Progress Bar: 0 to 15 games completed for current level */}
                <div className="w-full max-w-[280px] md:max-w-[340px] flex flex-col gap-1.5 font-mono text-[9px] text-[#a88a7e] select-none">
                    <div className="flex justify-between uppercase tracking-wider font-bold">
                        <span>Progreso Nivel</span>
                        <span style={{ color: accentColor }}>{completedGamesCount % 15}/15 juegos</span>
                    </div>
                    <div className="relative h-[4px] w-full bg-white/10 overflow-hidden border border-white/5">
                        <motion.div
                            className="absolute left-0 top-0 bottom-0 origin-left"
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedGamesCount % 15) * (100 / 15)}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 0 10px ${accentColor}, 0 0 4px ${accentColor}`
                            }}
                        />
                    </div>
                </div>

                {/* Hardening Mechanics Badges */}
                {activeMechanics.length > 0 && gameMode === 'solo' && (
                    <div className="flex flex-wrap gap-1.5 mt-1 justify-center">
                        {activeMechanics.map(m => {
                            const info: Record<string, { icon: string; label: string; color: string }> = {
                                mirror: { icon: '🪞', label: 'ESPEJO', color: '#c084fc' },
                                ghost: { icon: '👻', label: 'FANTASMA', color: '#22d3ee' },
                                padlock: { icon: '🔒', label: 'CANDADO', color: '#facc15' },
                                ice: { icon: '🧊', label: 'HIELO', color: '#87ceeb' },
                                bomb: { icon: '💣', label: 'BOMBA', color: '#ef4444' },
                                smoke: { icon: '💨', label: 'HUMO', color: '#9ca3af' },
                                gravity: { icon: '🏗️', label: 'GRAVEDAD', color: '#f97316' },
                            };
                            const { icon, label, color } = info[m] || { icon: '?', label: m, color: '#fff' };
                            return (
                                <div
                                    key={m}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 border font-mono text-[8px] font-black uppercase tracking-wider select-none"
                                    style={{ borderColor: color + '66', color, backgroundColor: color + '15' }}
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {gameLost && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
                    {/* Background Loop Video when Bomb explodes */}
                    {lostReason === 'bomb' && (
                        <video
                            src="/vid/Miel_smoke.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen pointer-events-none z-0"
                        />
                    )}

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
                            {lostReason === 'bomb' ? (
                                <span className="h-8 w-8 -rotate-45 text-2xl flex items-center justify-center select-none pointer-events-none">💣</span>
                            ) : (
                                <RotateCcw className="h-8 w-8 -rotate-45 text-red-400" />
                            )}
                        </div>
                        <h3 className="mb-2 text-3xl font-black uppercase tracking-normal text-white md:text-4xl animate-glitch-text">
                            {lostReason === 'bomb' ? '¡DETONACIÓN!' : 'Sin Espacio'}
                        </h3>
                        <p className="mb-8 text-center text-sm font-light tracking-normal text-[#a88a7e]">
                            {lostReason === 'bomb' 
                                ? 'Una ficha de bomba ha explotado. El tablero ha quedado destruido.' 
                                : 'Tu bandeja se ha llenado con cartas sin emparejar.'}
                        </p>
                        <button
                            onClick={handleRestart}
                            className="w-full bg-red-500 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-red-600 active:scale-95"
                        >
                            Reintentar
                        </button>
                        {lostReason !== 'bomb' && (
                            <button
                                onClick={handleUndo}
                                className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a88a7e] transition-all hover:bg-white/5 hover:text-white active:scale-95"
                            >
                                <Undo2 className="h-4 w-4" /> Deshacer
                            </button>
                        )}
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
                        <p className="mb-6 text-center text-sm font-light tracking-normal text-[#a88a7e]">
                            {gameMode === 'coop' ? '¡Tablero cooperativo completado en pareja! 💖' : gameMode === 'daily' ? '¡Desafío Diario superado con éxito! 🌟' : 'Has liberado todas nuestras memorias.'}
                        </p>

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

                        <div className="relative mb-6 w-full border border-white/10 bg-[#050505] p-4 flex justify-around items-center">
                            <div className="text-center">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tu Tiempo</span>
                                <span className="font-mono text-3xl tracking-normal text-white">{formatTime(timerRef.current?.getTime() || 0)}</span>
                                <span className={`mt-1 block text-[10px] font-bold uppercase ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>
                                    {profile === 'el' ? 'Santiago' : 'Mile'}
                                </span>
                            </div>
                            <div className="border-l border-white/10 h-10" />
                            <div className="text-center">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Racha Máxima</span>
                                <span className="font-mono text-3xl tracking-normal" style={{ color: accentColor }}>🔥 {maxGameCombo}</span>
                                <span className="mt-1 block text-[10px] font-bold uppercase text-orange-500">
                                    Combo
                                </span>
                            </div>
                        </div>

                        {gameMode === 'daily' ? (
                            (leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                                <div className="w-full mb-6">
                                    <h4 className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tabla de Récords (Diario)</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-a">Él</span>
                                            {leaderboard.el.length > 0 ? leaderboard.el.slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono">
                                                    <span className="text-white/35">#{i + 1}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                                        {s.highest_combo !== undefined && s.highest_combo > 0 && (
                                                            <span className="text-orange-500 text-[10px] font-bold">🔥{s.highest_combo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-b">Ella</span>
                                            {leaderboard.ella.length > 0 ? leaderboard.ella.slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono">
                                                    <span className="text-white/35">#{i + 1}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                                        {s.highest_combo !== undefined && s.highest_combo > 0 && (
                                                            <span className="text-orange-500 text-[10px] font-bold">🔥{s.highest_combo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : gameMode === 'solo' && levelComparisons.length > 0 ? (
                            <div className="w-full mb-6">
                                <h4 className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Comparativa de Niveles</h4>
                                <div className="space-y-2">
                                    {levelComparisons.map((comp, idx) => {
                                        const elTimeStr = comp.elTime !== null ? formatTime(comp.elTime) : '--:--';
                                        const ellaTimeStr = comp.ellaTime !== null ? formatTime(comp.ellaTime) : '--:--';
                                        return (
                                            <div key={idx} className="flex flex-col items-center border border-white/10 bg-[#0a0a0a] py-2 px-3 text-xs tracking-normal font-mono">
                                                <div className="mb-1 text-[9px] font-bold uppercase text-[#a88a7e] tracking-wider">
                                                    {comp.levelLabel}
                                                </div>
                                                <div className="flex w-full justify-center gap-3 text-white">
                                                    <span className="text-user-a font-bold">
                                                        el lvl {comp.elLvl} {elTimeStr} {comp.elCombo > 0 && <span className="text-orange-500 font-bold text-[10px]">🔥{comp.elCombo}</span>}
                                                    </span>
                                                    <span className="text-white/20">|</span>
                                                    <span className="text-user-b font-bold">
                                                        ella lvl {comp.ellaLvl} {ellaTimeStr} {comp.ellaCombo > 0 && <span className="text-orange-500 font-bold text-[10px]">🔥{comp.ellaCombo}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <button onClick={() => { setIsLoaded(false); }} className={`w-full bg-${accentClass} py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:opacity-80 active:scale-95`} style={{ backgroundColor: accentColor }}>Jugar de nuevo</button>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Modal para Escribir Mensaje en la Botella */}
            {bottleNoteModal && (
                <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-md border border-teal-500/40 bg-[#0c1616] p-6 shadow-[0_0_40px_rgba(0,128,128,0.25)] md:p-8">
                        <div className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-teal-400" />
                        <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-teal-400" />
                        <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-teal-400" />
                        <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-teal-400" />

                        <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-[#00ffcc] font-mono">
                            Mensaje en la Botella 🍾
                        </h3>
                        <p className="mb-4 text-xs leading-relaxed text-slate-400 font-mono">
                            Escribe una nota de amor, un mensajito dulce o una frase especial. Tu pareja verá una botella en la parte superior de su pantalla para revelarlo.
                        </p>

                        <textarea
                            value={bottleNoteText}
                            onChange={(e) => setBottleNoteText(e.target.value)}
                            placeholder="Te amo mucho, ten un día increíble..."
                            className="w-full h-28 border border-teal-500/20 bg-black/50 p-3 font-mono text-xs text-white focus:border-teal-500 focus:outline-none placeholder:text-teal-900/60"
                        />

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={async () => {
                                    if (bottleNoteText.trim()) {
                                        const success = await MahjongService.createBottleMessage(profile as 'el' | 'ella', bottleNoteText);
                                        if (success) {
                                            alert('¡Tu mensaje ha sido embotellado y arrojado al océano!');
                                            const target = profile === 'el' ? 'ella' : 'el';
                                            const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                                            NotificationService.addNotification(
                                                target,
                                                'bottle_sent',
                                                `¡${senderName} te ha arrojado una botella al mar! Juega para encontrarla. 🍾`
                                            ).catch(e => console.error(e));
                                            handleCloseWriteModal();
                                            refreshConnectionFeatures();
                                        }
                                    }
                                }}
                                className="flex-1 bg-[#008080] py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#009999] active:scale-95 transition-all"
                            >
                                Lanzar al mar
                            </button>
                            <button
                                onClick={handleCloseWriteModal}
                                className="border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Revelar Mensaje de Amor de la Botella */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {revealedBottleMessage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-hidden"
                        >
                            {/* Cyber scanlines */}
                            <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                                className="relative z-10 w-full max-w-sm border border-[#00ffcc]/40 bg-[#0c1616] p-6 text-center shadow-[0_0_40px_rgba(0,255,204,0.2)] md:p-8"
                            >
                                <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#00ffcc]" />
                                <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#00ffcc]" />
                                <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#00ffcc]" />
                                <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#00ffcc]" />

                                <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#00ffcc]">
                                    🍾 Mensaje de Amor Encontrado
                                </div>

                                {/* Recipient-specific video loop - Tall 9:16 aspect */}
                                <div className="relative mx-auto mb-6 aspect-[9/16] h-[380px] max-h-[50vh] overflow-hidden border border-[#00ffcc]/20 bg-black/60 p-[3px]">
                                    <div className="absolute top-0 left-0 h-2 w-2 border-t border-l border-[#00ffcc] z-10" />
                                    <div className="absolute top-0 right-0 h-2 w-2 border-t border-r border-[#00ffcc] z-10" />
                                    <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#00ffcc] z-10" />
                                    <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#00ffcc] z-10" />

                                    <video
                                        ref={videoRef}
                                        src="/vid/mahjong_Sam.mp4"
                                        autoPlay
                                        loop={false}
                                        muted
                                        playsInline
                                        onTimeUpdate={(e) => {
                                            const video = e.currentTarget;
                                            // Start fade in message at 3.2s
                                            if (video.currentTime >= 3.2 && video.currentTime < 4.0) {
                                                setShowMessageText((prev) => {
                                                    if (!prev) return true;
                                                    return prev;
                                                });
                                            }
                                            // Pause at 4.0s when the scroll opens and is fully open
                                            if (video.currentTime >= 4.0 && !hasPausedForMessage) {
                                                video.pause();
                                                setHasPausedForMessage(true);
                                            }
                                        }}
                                        onEnded={() => {
                                            if (pendingReceivedBottle && revealedBottleMessage?.id === pendingReceivedBottle.id) {
                                                MahjongService.revealBottleMessage(pendingReceivedBottle.id, profile as 'el' | 'ella')
                                                    .then(() => refreshConnectionFeatures());
                                            }
                                            setRevealedBottleMessage(null);
                                            setTimerActive(true);
                                            setHasPausedForMessage(false);
                                            setShowMessageText(false);
                                        }}
                                        className="h-full w-full object-cover"
                                    />

                                    {/* Message text overlaid inside the video box */}
                                    <AnimatePresence>
                                        {showMessageText && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                transition={{ duration: 0.6, ease: "easeOut" }}
                                                className="absolute inset-0 flex flex-col justify-center items-center bg-black/55 p-3 select-none font-serif text-teal-100 italic text-center z-20"
                                            >
                                                <div className="max-w-[90%] break-words bg-black/75 border border-[#00ffcc]/30 px-3 py-4 rounded shadow-2xl text-[11px] leading-relaxed font-mono">
                                                    "{revealedBottleMessage.text}"
                                                    <span className="block mt-3 text-[8px] uppercase tracking-wider font-mono text-[#a88a7e] not-italic">
                                                        De: {revealedBottleMessage.sender}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {!hasPausedForMessage || showMessageText ? (
                                    <button
                                        disabled={!showMessageText}
                                        onClick={() => {
                                            if (!showMessageText) return;
                                            setShowMessageText(false);
                                            if (videoRef.current) {
                                                // Seek to 4.2s (the start of the retreat animation) and play immediately
                                                videoRef.current.currentTime = 4.2;
                                                videoRef.current.play().catch(e => console.error("Error playing video:", e));
                                            }
                                        }}
                                        className="w-full bg-[#00ffcc] py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-teal-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ¡Qué tierno! Continuar
                                    </button>
                                ) : (
                                    <div className="w-full py-3 text-xs font-mono uppercase tracking-[0.18em] text-teal-400 bg-teal-950/20 border border-teal-500/20">
                                        Guardando en la memoria...
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <div
                className="relative flex w-full max-w-[880px] max-md:max-w-none max-md:w-screen max-md:shrink-0 h-[690px] max-md:h-[590px] flex-col justify-center overflow-hidden border border-white/10 max-md:border-x-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] transition-all duration-200"
                ref={containerRef}
            >
                <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-70" />
                <AnimatedBrutalistCorners color={accentColor} size={12} thickness={1.5} />

                {/* Daily Puzzle stats / scoreboard screen */}
                {gameMode === 'daily' && dailyPlayRecord?.status !== 'started' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 overflow-y-auto">
                        <div className="border border-white/10 bg-black/95 p-6 text-center w-full max-w-md relative font-mono">
                            <AnimatedBrutalistCorners color={accentColor} size={10} thickness={1.5} />

                            <h3 className="text-xl font-black uppercase tracking-wider text-white mb-2 animate-glitch-text" style={{ color: accentColor }}>
                                DESAFÍO DIARIO
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest">
                                {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}
                            </p>

                            {/* Today's Results comparing Santiago vs Milena */}
                            <div className="mb-6 border-b border-white/10 pb-6">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] mb-3 text-left">
                                    Resultados de Hoy
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="border border-white/10 bg-black/40 p-3 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-user-a mb-1">Santiago</span>
                                        {dailyStats.el ? (
                                            dailyStats.el.status === 'completed' ? (
                                                <div className="text-center">
                                                    <span className="text-green-400 font-bold block">COMPLETADO</span>
                                                    <span className="text-white/60 text-[10px] font-mono block mt-0.5">
                                                        {formatTime(dailyStats.el.time_seconds)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-red-400 font-bold">FALLADO</span>
                                            )
                                        ) : (
                                            <span className="text-white/35 italic">Pendiente</span>
                                        )}
                                    </div>
                                    <div className="border border-white/10 bg-black/40 p-3 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-user-b mb-1">Milena</span>
                                        {dailyStats.ella ? (
                                            dailyStats.ella.status === 'completed' ? (
                                                <div className="text-center">
                                                    <span className="text-green-400 font-bold block">COMPLETADO</span>
                                                    <span className="text-white/60 text-[10px] font-mono block mt-0.5">
                                                        {formatTime(dailyStats.ella.time_seconds)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-red-400 font-bold">FALLADO</span>
                                            )
                                        ) : (
                                            <span className="text-white/35 italic">Pendiente</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Historic stats */}
                            <div className="mb-6">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] mb-3 text-left">
                                    Historial Acumulado
                                </h4>
                                <div className="space-y-3">
                                    {/* Santiago */}
                                    <div className="flex items-center justify-between text-[11px] border border-white/5 bg-[#050505] p-2">
                                        <span className="font-bold text-user-a">Santiago:</span>
                                        <span className="text-white/80">
                                            {historicDailyStats.el.completed} ✔ | {historicDailyStats.el.failed} ❌ | {historicDailyStats.el.bestTime ? `⏱ ${formatTime(historicDailyStats.el.bestTime)}` : 'N/A'}
                                        </span>
                                    </div>
                                    {/* Milena */}
                                    <div className="flex items-center justify-between text-[11px] border border-white/5 bg-[#050505] p-2">
                                        <span className="font-bold text-user-b">Milena:</span>
                                        <span className="text-white/80">
                                            {historicDailyStats.ella.completed} ✔ | {historicDailyStats.ella.failed} ❌ | {historicDailyStats.ella.bestTime ? `⏱ ${formatTime(historicDailyStats.ella.bestTime)}` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Play or locked message */}
                            {(!dailyPlayRecord || dailyPlayRecord.status === null) ? (
                                <button
                                    onClick={handleStartDailyGame}
                                    className="w-full bg-[#00ffcc] py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-teal-300 active:scale-95 transition-all"
                                    style={{ backgroundColor: accentColor, color: '#000' }}
                                >
                                    Iniciar Desafío Diario
                                </button>
                            ) : (
                                <div className="border border-red-500/20 bg-red-950/15 p-3 text-[10px] text-red-400 uppercase tracking-wider font-bold">
                                    Intento de hoy finalizado. ¡Vuelve mañana!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Coop Turn lock screen indicator */}
                {gameMode === 'coop' && activeCoopGame && coopTurn !== profile && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                        <div className="border border-white/10 bg-black/90 p-6 text-center max-w-xs relative">
                            <AnimatedBrutalistCorners color={accentColor} size={8} thickness={1.5} />
                            <div className="animate-pulse mb-3 text-sm font-bold uppercase tracking-widest text-[#a88a7e]">
                                Esperando a tu pareja
                            </div>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
                                Es el turno de {coopTurn === 'el' ? 'Santiago' : 'Milena'} para jugar y despejar recuerdos.
                            </p>
                            <div className="text-[10px] uppercase font-mono text-slate-500">
                                Recibirás una notificación cuando sea tu turno.
                            </div>
                        </div>
                    </div>
                )}

                {/* Coop game setup screen */}
                {gameMode === 'coop' && !activeCoopGame && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-4">
                        <div className="border border-white/10 bg-black/95 p-6 text-center max-w-sm relative">
                            <AnimatedBrutalistCorners color={accentColor} size={10} thickness={1.5} />
                            <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-2 font-mono">Tablero Cooperativo</h3>
                            <p className="text-xs text-slate-400 mb-5 leading-relaxed font-mono">
                                Trabaja con tu pareja para despejar el tablero y desbloquear recuerdos mutuos.
                            </p>

                            <div className="flex flex-col gap-2 font-mono">
                                <button
                                    onClick={() => handleStartCoopGame('turtle')}
                                    className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                                >
                                    Iniciar: Tortuga
                                </button>
                                <button
                                    onClick={() => handleStartCoopGame('peaks')}
                                    className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                                >
                                    Iniciar: Picos Gemelos
                                </button>
                                <button
                                    onClick={() => handleStartCoopGame('random')}
                                    className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                                >
                                    Iniciar: Caos
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 3D BRUTALIST HUD: TIMER (TOP LEFT OF DOCK) --- */}
                <div className="absolute top-[50px] right-[calc(50%+100px)] md:top-[62px] md:right-[calc(50%+155px)] left-auto z-20">
                    <MahjongTimer isActive={timerActive} formatTime={formatTime} ref={timerRef} accentColor={accentColor} />
                </div>

                {/* --- 3D BRUTALIST HUD: PAIR COUNTER (TOP RIGHT OF DOCK) --- */}
                <div className="absolute top-[50px] left-[calc(50%+100px)] md:top-[62px] md:left-[calc(50%+155px)] right-auto z-20 select-none group">
                    {/* Remaining fire countdown timer */}
                    {streakCombo > 0 && (
                        <div className="absolute -top-[24px] left-0 right-0 text-center font-mono text-[9px] font-black text-orange-500 animate-pulse bg-black/90 border border-orange-500/40 px-1 py-0.5 shadow-[0_0_8px_rgba(255,80,0,0.3)] rounded-sm">
                            🔥 {streakTimeRemaining}s
                        </div>
                    )}
                    {/* 3D shadow/extrusion */}
                    <div
                        className="absolute inset-0 translate-x-[3px] translate-y-[3px] border-2 border-black transition-all duration-200"
                        style={{ backgroundColor: streakCombo > 0 ? '#ff4500' : accentColor }}
                    />
                    {/* Foreground container */}
                    <div
                        className={`relative flex items-center gap-1.5 md:gap-2 border-2 bg-[#0a0a0a] px-2 py-1 md:px-3.5 md:py-2 transition-all duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] ${
                            isMatchPulse ? 'scale-105' : 'scale-100'
                        }`}
                        style={{
                            borderColor: streakCombo > 0 ? '#ff4500' : '#ffffff',
                            boxShadow: streakCombo > 0 
                                ? '0 0 15px rgba(255, 69, 0, 0.4)' 
                                : isMatchPulse 
                                    ? `0 0 15px ${accentColor}80` 
                                    : 'none'
                        }}
                    >
                        {/* Glowing/pulsing Flame icon next to the number */}
                        {streakCombo > 0 && (
                            <motion.div
                                key={streakCombo}
                                initial={{ scale: 3 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="text-orange-500 mr-0.5"
                            >
                                <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-bounce" />
                            </motion.div>
                        )}
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mb-0.5">Parejas</span>
                            <div className="flex items-baseline gap-1 font-mono tracking-normal">
                                <motion.span
                                    key={Math.floor(matchedCount / 2)}
                                    initial={{ scale: 3.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                    className="inline-block text-xs md:text-sm font-black tabular-nums text-white"
                                    style={{ transformOrigin: "center" }}
                                >
                                    {Math.floor(matchedCount / 2)}
                                </motion.span>
                                <span className="text-[9px] md:text-[10px] text-white/40">/ {Math.floor(tiles.length / 2)}</span>
                            </div>
                        </div>
                        <Trophy
                            className={`h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-300 ${isMatchPulse ? 'rotate-12 scale-125' : 'rotate-0'}`}
                            style={{ color: streakCombo > 0 ? '#ff4500' : accentColor }}
                        />
                    </div>
                </div>

                {/* --- 3D BRUTALIST HUD: ACTIONS (BOTTOM CENTER, BELOW PROGRESS BAR) --- */}
                <div className="absolute bottom-[8px] md:bottom-[12px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-4">
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
                    {gameMode !== 'daily' && (
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
                    )}


                </div>

                <div className="h-6" />


                {isLoaded && !hasStarted && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <button
                            onClick={() => {
                                requestGameFullscreen();
                                setHasStarted(true);
                                setTimerActive(true);
                            }}
                            className="bg-purple-600 px-8 py-4 text-xl font-black uppercase tracking-[0.2em] text-white hover:bg-purple-500 active:scale-95 transition-all shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:shadow-[0_0_50px_rgba(139,92,246,0.8)] border border-purple-400"
                        >
                            INICIAR JUEGO 🀄
                        </button>
                    </div>
                )}

                <MahjongCanvas
                    tiles={tiles}
                    freeTilesMap={freeTilesMap}
                    dockIds={dockIds}
                    onTilePointerDown={handleTilePointerDown}
                    isMobile={isMobile}
                    ghostSolidIds={ghostSolidIds}
                    hasStarted={hasStarted}
                />

                {/* Modal para Dibujar */}
                {drawingModalOpen && (
                    <DrawingCanvasModal
                        profile={profile as 'el' | 'ella'}
                        accentColor={accentColor}
                        onClose={() => {
                            setDrawingModalOpen(false);
                            if (!gameLost && matchedCount < tiles.length) {
                                setTimerActive(true);
                            }
                        }}
                        onSave={async (dataUrl, caption) => {
                            const success = await MahjongService.saveDrawing(profile as 'el' | 'ella', dataUrl, caption);
                            if (success) {
                                alert('¡Tu dibujo ha sido enviado a tu pareja!');
                                const target = profile === 'el' ? 'ella' : 'el';
                                const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                                NotificationService.addNotification(
                                    target,
                                    'drawing_sent',
                                    `¡${senderName} te ha enviado un dibujo especial! Encuéntralo en tu tablero. 🎨`
                                ).catch(e => console.error(e));
                                refreshConnectionFeatures();
                            }
                            setDrawingModalOpen(false);
                            if (!gameLost && matchedCount < tiles.length) {
                                setTimerActive(true);
                            }
                        }}
                    />
                )}

                {/* Modal para Revelar Dibujo */}
                {revealDrawingModalOpen && revealedDrawingData && (
                    <RevealDrawingModal
                        data={revealedDrawingData}
                        onClose={() => {
                            setRevealDrawingModalOpen(false);
                            setRevealedDrawingData(null);
                            if (!gameLost && matchedCount < tiles.length) {
                                setTimerActive(true);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

interface DrawingCanvasModalProps {
    profile: 'el' | 'ella';
    accentColor: string;
    onClose: () => void;
    onSave: (dataUrl: string, caption: string) => void;
}

const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({ profile, accentColor, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#ffffff');
    const [thickness, setThickness] = useState(4);
    const [caption, setCaption] = useState('');
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        
        isDrawingRef.current = true;
        const pos = getCoordinates(e);
        lastPosRef.current = pos;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, thickness / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getCoordinates(e);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPosRef.current = pos;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(e.pointerId);
        }
        isDrawingRef.current = false;
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSend = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl, caption);
    };

    return (
        <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md font-mono">
            <div className="relative w-full max-w-lg border border-purple-500/40 bg-[#0d0914] p-5 shadow-[0_0_40px_rgba(139,92,246,0.25)] flex flex-col">
                <div className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-purple-400" />
                <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-purple-400" />
                <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-purple-400" />
                <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-purple-400" />

                <h3 className="mb-2 text-xl font-bold uppercase tracking-wider text-purple-400">
                    Lienzo de Amor 🎨
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">
                    ¡Dibuja algo especial para tu pareja! Tu dibujo aparecerá en su tablero de juego hoy.
                </p>

                <div className="relative w-full border border-purple-500/20 bg-black overflow-hidden flex justify-center items-center">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={300}
                        className="touch-none cursor-crosshair max-w-full"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        {['#ffffff', '#ef4444', '#3b82f6', '#eab308', '#22c55e', '#d946ef'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 border transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white">
                        <span>Grosor:</span>
                        {[2, 4, 8, 14].map((t) => (
                            <button
                                key={t}
                                onClick={() => setThickness(t)}
                                className={`px-2 py-0.5 border ${thickness === t ? 'border-purple-400 text-purple-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                            >
                                {t === 2 ? 'Fino' : t === 4 ? 'Med' : t === 8 ? 'Grueso' : 'Max'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleClear}
                        className="px-3 py-1 border border-red-500/30 text-red-400 text-xs uppercase tracking-wider hover:bg-red-500/10 transition-all"
                    >
                        Limpiar
                    </button>
                </div>

                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escribe un mensaje o dedicatoria aquí... (opcional)"
                    className="w-full mt-4 border border-purple-500/20 bg-black/50 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none placeholder:text-purple-900/60"
                />

                <div className="mt-5 flex gap-3">
                    <button
                        onClick={handleSend}
                        className="flex-1 bg-purple-600 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-purple-500 active:scale-95 transition-all"
                    >
                        Enviar Dibujo 🎨
                    </button>
                    <button
                        onClick={onClose}
                        className="border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 active:scale-95 transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface RevealDrawingModalProps {
    data: { sender: string; image: string; caption: string };
    onClose: () => void;
}

const RevealDrawingModal: React.FC<RevealDrawingModalProps> = ({ data, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100099] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-mono">
            <div className="relative w-full max-w-md border border-purple-500/40 bg-[#0d0914] p-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] flex flex-col items-center">
                <div className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-purple-400" />
                <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-purple-400" />
                <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-purple-400" />
                <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-purple-400" />

                <h3 className="mb-1 text-lg font-bold uppercase tracking-wider text-purple-400 text-center">
                    Dibujo de {data.sender} 🖼️
                </h3>
                <span className="mb-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    Regalo Especial de Hoy
                </span>

                <div className="relative w-full border border-purple-500/20 bg-black aspect-[4/3] p-1 flex justify-center items-center">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt="Dibujo de amor"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-slate-600 text-xs italic">No se pudo cargar el dibujo</div>
                    )}
                </div>

                <p className="w-full mt-4 text-center text-xs leading-relaxed text-purple-200 border-t border-purple-500/10 pt-4 italic">
                    "{data.caption}"
                </p>

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-purple-600 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white hover:bg-purple-500 active:scale-95 transition-all"
                >
                    Cerrar Dibujo ✨
                </button>
            </div>
        </div>
    );
};
