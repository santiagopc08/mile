export type DogId = 'miel' | 'kiaro' | 'nika' | 'sam' | 'boneMine' | 'loveBomb' | 'boxerDog';

export type EnemyId =
    | 'cat_scout'
    | 'cat_box'
    | 'cat_ninja'
    | 'vacuum_monster'
    | 'bath_groomer'
    | 'squirrel_nut'
    | 'boss_mecha_cat';

export interface DogCard {
    id: DogId;
    name: string;
    nickname: string;
    cost: number;
    cooldown: number; // in seconds
    hp: number;
    icon: string;
    avatarImg?: string;
    description: string;
    accentColor: string;
    role: 'sun' | 'shooter' | 'ice' | 'wall' | 'mine' | 'bomb' | 'melee';
}

export interface PlacedDog {
    id: string;
    type: DogId;
    row: number;
    col: number;
    hp: number;
    maxHp: number;
    actionTimer: number;
    actionInterval: number;
    animFrame: number;
    state: 'idle' | 'attacking' | 'producing' | 'arming' | 'armed' | 'ultimate';
    ultimateTimer?: number;
    isArmored?: boolean;
    bubbleTrapped?: boolean;
}

export interface Enemy {
    id: string;
    type: EnemyId;
    name: string;
    row: number;
    x: number; // canvas coordinate X
    speed: number;
    baseSpeed: number;
    hp: number;
    maxHp: number;
    damage: number;
    attackInterval: number;
    attackTimer: number;
    state: 'walking' | 'attacking' | 'jumping' | 'stunned' | 'dying';
    isFrozen: number; // timer for slow effect
    isChilled: boolean;
    hasJumped?: boolean;
    armorHp?: number;
    maxArmorHp?: number;
    specialTimer?: number;
    animFrame: number;
    color: string;
    hasSuperCookieDrop?: boolean;
}

export interface Projectile {
    id: string;
    row: number;
    x: number;
    y: number;
    vx: number;
    damage: number;
    isIce: boolean;
    isSonic: boolean;
    isBig: boolean;
    trail: { x: number; y: number }[];
}

export interface Croqueta {
    id: string;
    x: number;
    y: number;
    targetY: number;
    vx: number;
    vy: number;
    value: number;
    life: number;
    collected: boolean;
    isGolden: boolean;
    pulse: number;
}

export interface Lawnmower {
    row: number;
    x: number;
    active: boolean;
    triggered: boolean;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    alpha: number;
    isHeart?: boolean;
    isStar?: boolean;
    isIce?: boolean;
}

export interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    maxLife: number;
}

export interface WaveSchedule {
    time: number; // in seconds from level start
    enemies: { type: EnemyId; row?: number; hasCookie?: boolean }[];
    isHugeWave?: boolean;
    isFinalWave?: boolean;
}

export interface LevelConfig {
    levelNumber: number;
    title: string;
    subtitle: string;
    backgroundTheme: 'day' | 'pool' | 'night' | 'roof';
    startingCroquetas: number;
    availableDogs: DogId[];
    duration: number; // total estimated wave time
    waves: WaveSchedule[];
    rewardDescription: string;
}
