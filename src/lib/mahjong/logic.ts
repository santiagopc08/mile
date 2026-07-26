import { TileState, TileContent } from '@/components/MahjongTile';

// Fecha local (YYYY-MM-DD) ajustada a la zona horaria del navegador
function getLocalDateString() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

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

// Estética del letrero de combo por nivel de racha (paleta de fuego ascendente)
const COMBO_TIERS: { emoji: string; box: string; glow: string; label: string; text: string }[] = [
    { emoji: '✨', box: '#ff8c00', glow: 'rgba(255,140,0,0.55)', label: 'text-amber-400/70', text: '#ffedd5' },   // 1
    { emoji: '🔥', box: '#ff6a00', glow: 'rgba(255,106,0,0.6)', label: 'text-orange-400/70', text: '#ffe4c4' },   // 2
    { emoji: '🔥', box: '#ff4500', glow: 'rgba(255,69,0,0.7)', label: 'text-orange-500/80', text: '#fff0e0' },    // 3
    { emoji: '🌋', box: '#ff2d00', glow: 'rgba(255,45,0,0.8)', label: 'text-red-500/80', text: '#fff5ec' },       // 4
    { emoji: '💥', box: '#ffd000', glow: 'rgba(255,208,0,0.85)', label: 'text-yellow-300/90', text: '#ffffff' },  // 5+
];

function getComboTier(combo: number) {
    return COMBO_TIERS[Math.min(COMBO_TIERS.length - 1, Math.max(0, combo - 1))];
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

export {
    getLocalDateString,
    TILESETS,
    getUnlockedTilesForCount,
    getTargetTilesForLevel,
    LAYOUT_INFO,
    filterCoordsByColumns,
    generateCoordinates,
    shuffleArray,
    COMBO_TIERS,
    getComboTier,
    isSlotFree,
    generateSolvableBoard,
};
export type { LayoutType, LeaderboardEntry };
