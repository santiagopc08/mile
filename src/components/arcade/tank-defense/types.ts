export type TileType = 'empty' | 'brick' | 'steel' | 'water' | 'forest' | 'baseCore' | 'baseDestroyed';
export type Direction = 'up' | 'right' | 'down' | 'left';
export type EnemyType = 'scout' | 'assault' | 'heavy';
export type PowerUpType = 'star' | 'shield' | 'bomb' | 'freeze' | 'fortress';

export interface Tank {
    x: number;
    y: number;
    dir: Direction;
    speed: number;
    hp: number;
    maxHp: number;
    shootCooldown: number;
    moveTimer: number;
    active: boolean;
    isPlayer: boolean;
    enemyType?: EnemyType;
    hasPowerUp?: boolean;
    shieldTimer: number;
}

export interface Bullet {
    x: number;
    y: number;
    dir: Direction;
    speed: number;
    fromPlayer: boolean;
    active: boolean;
}

export interface PowerUp {
    x: number;
    y: number;
    type: PowerUpType;
    lifeTimer: number;
    active: boolean;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    alpha: number;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

export interface TankGameState {
    map: TileType[][];
    player: Tank;
    enemies: Tank[];
    bullets: Bullet[];
    powerUps: PowerUp[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    stage: number;
    score: number;
    highScore: number;
    lives: number;
    weaponLevel: number;
    enemiesRemaining: number;
    enemiesSpawned: number;
    enemySpawnTimer: number;
    freezeTimer: number;
    fortressTimer: number;
    briefingTimer: number;
    shakeIntensity: number;
    shakeTime: number;
    gameState: 'briefing' | 'playing' | 'gameover' | 'victory';
    keysHeld: Set<string>;
    touchMoveDir: Direction | null;
}
