'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TankAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Tv, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame } from 'lucide-react';
import { Tank, TileType, EnemyType, PowerUpType, Direction, Bullet, PowerUp, Particle, FloatingText } from './tank-defense/types';
import { MAP_COLS, MAP_ROWS, TILE_SIZE, V_WIDTH, V_HEIGHT, BOARD_X, BOARD_Y, DIR_VECTORS } from './tank-defense/constants';
import { renderGameScene } from './tank-defense/renderer';

export interface TankDefenseProps {
    accentColor?: string;
}

export function TankDefenseCanvas(_props: TankDefenseProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tank_defense_highscore');
            return saved ? parseInt(saved, 10) : 0;
        }
        return 0;
    });
    const [stage, setStage] = useState(1);
    const [lives, setLives] = useState(3);
    const [, setWeaponLevel] = useState(1);
    const [gameState, setGameState] = useState<'briefing' | 'playing' | 'gameover' | 'victory'>('briefing');
    const [mutedState, setMutedState] = useState(() => loadMutedPreference());
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        map: Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill('empty' as TileType)),
        player: {
            x: BOARD_X + 6 * TILE_SIZE,
            y: BOARD_Y + 17 * TILE_SIZE,
            dir: 'up' as Direction,
            speed: 160,
            hp: 1,
            maxHp: 1,
            shootCooldown: 0,
            moveTimer: 0,
            active: true,
            isPlayer: true,
            shieldTimer: 3,
        } as Tank,
        enemies: [] as Tank[],
        bullets: [] as Bullet[],
        powerUps: [] as PowerUp[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        stage: 1,
        score: 0,
        highScore: 0,
        lives: 3,
        weaponLevel: 1,
        enemiesRemaining: 14,
        enemiesSpawned: 0,
        enemySpawnTimer: 1.0,
        freezeTimer: 0,
        fortressTimer: 0,
        briefingTimer: 1.5,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'briefing' as 'briefing' | 'playing' | 'gameover' | 'victory',
        keysHeld: new Set<string>(),
        touchMoveDir: null as Direction | null,
    });

    useEffect(() => {
        stateRef.current.highScore = highScore;
    }, [highScore]);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const addShake = (intensity = 8, dur = 0.25) => {
        const s = stateRef.current;
        s.shakeIntensity = intensity;
        s.shakeTime = dur;
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#facc15') => {
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.8 });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 16, speed = 180) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.4 + Math.random() * 0.8);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: 2 + Math.random() * 3,
                color,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                alpha: 1.0,
            });
        }
    };

    const loadMap = useCallback((stageNum: number) => {
        const s = stateRef.current;
        s.gameState = 'briefing';
        s.briefingTimer = 1.5;
        s.enemiesRemaining = 12 + stageNum * 2;
        s.enemiesSpawned = 0;
        s.enemySpawnTimer = 1.0;
        s.freezeTimer = 0;
        s.fortressTimer = 0;
        s.enemies = [];
        s.bullets = [];
        s.powerUps = [];
        s.particles = [];

        setGameState('briefing');
        setStage(stageNum);

        // Clear Grid
        s.map = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill('empty' as TileType));

        // Steel Borders
        for (let c = 0; c < MAP_COLS; c++) {
            s.map[0][c] = 'steel';
            s.map[MAP_ROWS - 1][c] = 'steel';
        }
        for (let r = 0; r < MAP_ROWS; r++) {
            s.map[r][0] = 'steel';
            s.map[r][MAP_COLS - 1] = 'steel';
        }

        // HQ Base Core at (9, 17)
        s.map[17][9] = 'baseCore';
        // Fortress Bricks around Base Core
        s.map[17][8] = 'brick';
        s.map[17][10] = 'brick';
        s.map[16][8] = 'brick';
        s.map[16][9] = 'brick';
        s.map[16][10] = 'brick';

        // Procedural Maze Layout
        for (let r = 2; r < MAP_ROWS - 3; r += 2) {
            for (let c = 2; c < MAP_COLS - 2; c += 2) {
                const roll = Math.random();
                if (roll > 0.40) {
                    s.map[r][c] = 'brick';
                    s.map[r + 1][c] = 'brick';
                } else if (roll > 0.25) {
                    s.map[r][c] = 'steel';
                } else if (roll > 0.15) {
                    s.map[r][c] = 'water';
                    s.map[r][c + 1] = 'water';
                } else if (roll > 0.05) {
                    s.map[r][c] = 'forest';
                }
            }
        }

        // Spawn Player Tank
        s.player = {
            x: BOARD_X + 6 * TILE_SIZE,
            y: BOARD_Y + 17 * TILE_SIZE,
            dir: 'up',
            speed: 160,
            hp: 1,
            maxHp: 1,
            shootCooldown: 0,
            moveTimer: 0,
            active: true,
            isPlayer: true,
            shieldTimer: 3,
        };
    }, []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.score = 0;
        s.lives = 3;
        s.weaponLevel = 1;
        s.stage = 1;

        setScore(0);
        setLives(3);
        setWeaponLevel(1);

        loadMap(1);
    }, [loadMap]);

    const checkTileCollision = (x: number, y: number, size = TILE_SIZE - 4, ignoreWater = false): boolean => {
        const s = stateRef.current;
        const minC = Math.max(0, Math.floor((x - BOARD_X) / TILE_SIZE));
        const maxC = Math.min(MAP_COLS - 1, Math.floor((x + size - 1 - BOARD_X) / TILE_SIZE));
        const minR = Math.max(0, Math.floor((y - BOARD_Y) / TILE_SIZE));
        const maxR = Math.min(MAP_ROWS - 1, Math.floor((y + size - 1 - BOARD_Y) / TILE_SIZE));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const t = s.map[r][c];
                if (t === 'brick' || t === 'steel' || t === 'baseCore' || t === 'baseDestroyed') return true;
                if (!ignoreWater && t === 'water') return true;
            }
        }
        return false;
    };

    const damageTileAt = useCallback((col: number, row: number, heavy: boolean) => {
        const s = stateRef.current;
        if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;
        const t = s.map[row][col];

        if (t === 'brick') {
            s.map[row][col] = 'empty';
            TankAudio.brickHit();
            spawnParticles(BOARD_X + (col + 0.5) * TILE_SIZE, BOARD_Y + (row + 0.5) * TILE_SIZE, '#f59e0b', 12, 140);
        } else if (t === 'steel' && heavy) {
            s.map[row][col] = 'empty';
            TankAudio.hit();
            spawnParticles(BOARD_X + (col + 0.5) * TILE_SIZE, BOARD_Y + (row + 0.5) * TILE_SIZE, '#00f0ff', 18, 180);
        } else if (t === 'baseCore') {
            s.map[row][col] = 'baseDestroyed';
            TankAudio.explosion();
            TankAudio.baseAlert();
            addShake(18, 0.5);
            spawnParticles(BOARD_X + (col + 0.5) * TILE_SIZE, BOARD_Y + (row + 0.5) * TILE_SIZE, '#ef4444', 45, 260);
            s.gameState = 'gameover';
            setGameState('gameover');
        }
    }, []);

    const spawnEnemy = useCallback(() => {
        const s = stateRef.current;
        if (s.enemiesSpawned >= s.enemiesRemaining || s.enemies.length >= 4) return;

        const spawnCols = [2, 9, 16];
        const c = spawnCols[Math.floor(Math.random() * spawnCols.length)];
        const sx = BOARD_X + c * TILE_SIZE;
        const sy = BOARD_Y + 1 * TILE_SIZE;

        // Check if obstructed
        for (const e of s.enemies) {
            if (e.active && Math.hypot(e.x - sx, e.y - sy) < TILE_SIZE) return;
        }

        const roll = Math.random();
        let type: EnemyType = 'scout';
        let hp = 1;
        let spd = 140;
        const hasPower = Math.random() < 0.25;

        if (roll > 0.70) {
            type = 'heavy';
            hp = 3;
            spd = 90;
        } else if (roll > 0.40) {
            type = 'assault';
            hp = 2;
            spd = 120;
        }

        s.enemies.push({
            x: sx,
            y: sy,
            dir: 'down',
            speed: spd,
            hp,
            maxHp: hp,
            shootCooldown: 1.0 + Math.random() * 1.5,
            moveTimer: 0,
            active: true,
            isPlayer: false,
            enemyType: type,
            hasPowerUp: hasPower,
            shieldTimer: 0,
        });

        s.enemiesSpawned++;
    }, []);

    const fireBullet = (tank: Tank) => {
        const s = stateRef.current;
        const center = { x: tank.x + TILE_SIZE / 2, y: tank.y + TILE_SIZE / 2 };
        const dVec = DIR_VECTORS[tank.dir];
        const speed = tank.isPlayer ? 420 + s.weaponLevel * 60 : 320;

        s.bullets.push({
            x: center.x + dVec.x * (TILE_SIZE * 0.45),
            y: center.y + dVec.y * (TILE_SIZE * 0.45),
            dir: tank.dir,
            speed,
            fromPlayer: tank.isPlayer,
            active: true,
        });

        TankAudio.fire();
        tank.shootCooldown = tank.isPlayer ? (s.weaponLevel >= 3 ? 0.18 : 0.32) : 1.5 + Math.random() * 1.5;
    };

    const applyPowerUp = useCallback((type: PowerUpType) => {
        const s = stateRef.current;
        TankAudio.powerup();
        addFloatingText(s.player.x + TILE_SIZE / 2, s.player.y, `+500 ${type.toUpperCase()}!`, '#facc15');
        s.score += 500;
        setScore(s.score);

        switch (type) {
            case 'star':
                s.weaponLevel = Math.min(4, s.weaponLevel + 1);
                setWeaponLevel(s.weaponLevel);
                break;
            case 'shield':
                s.player.shieldTimer = 10;
                break;
            case 'bomb':
                s.enemies.forEach(e => {
                    if (e.active) {
                        e.active = false;
                        spawnParticles(e.x + TILE_SIZE / 2, e.y + TILE_SIZE / 2, '#ef4444', 25, 220);
                        s.score += 200;
                    }
                });
                TankAudio.explosion();
                addShake(14, 0.35);
                setScore(s.score);
                break;
            case 'freeze':
                s.freezeTimer = 8;
                break;
            case 'fortress':
                s.fortressTimer = 15;
                s.map[17][8] = 'steel';
                s.map[17][10] = 'steel';
                s.map[16][8] = 'steel';
                s.map[16][9] = 'steel';
                s.map[16][10] = 'steel';
                break;
        }
    }, []);

    // ── MAIN 60 FPS GAME LOOP ───────────────────────────────────────────────
    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const s = stateRef.current;

            // Screen Shake
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Update particles
            s.particles.forEach(pt => {
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.life -= dt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            // Update floating texts
            s.floatingTexts.forEach(ft => {
                ft.y -= 30 * dt;
                ft.life -= dt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            if (s.gameState === 'briefing') {
                s.briefingTimer -= dt;
                if (s.briefingTimer <= 0) {
                    s.gameState = 'playing';
                    setGameState('playing');
                }
            } else if (s.gameState === 'playing') {
                // Fortress Rebuild Timer expiration
                if (s.fortressTimer > 0) {
                    s.fortressTimer -= dt;
                    if (s.fortressTimer <= 0) {
                        s.map[17][8] = 'brick';
                        s.map[17][10] = 'brick';
                        s.map[16][8] = 'brick';
                        s.map[16][9] = 'brick';
                        s.map[16][10] = 'brick';
                    }
                }

                // ── Player Update ──
                if (s.player.active) {
                    if (s.player.shieldTimer > 0) s.player.shieldTimer -= dt;
                    s.player.shootCooldown = Math.max(0, s.player.shootCooldown - dt);

                    let moveDir: Direction | null = s.touchMoveDir;
                    if (s.keysHeld.has('w') || s.keysHeld.has('ArrowUp')) moveDir = 'up';
                    else if (s.keysHeld.has('s') || s.keysHeld.has('ArrowDown')) moveDir = 'down';
                    else if (s.keysHeld.has('a') || s.keysHeld.has('ArrowLeft')) moveDir = 'left';
                    else if (s.keysHeld.has('d') || s.keysHeld.has('ArrowRight')) moveDir = 'right';

                    if (moveDir) {
                        s.player.dir = moveDir;
                        const dVec = DIR_VECTORS[moveDir];
                        const nx = s.player.x + dVec.x * (s.player.speed * dt);
                        const ny = s.player.y + dVec.y * (s.player.speed * dt);

                        if (!checkTileCollision(nx + 2, ny + 2, TILE_SIZE - 4)) {
                            s.player.x = nx;
                            s.player.y = ny;
                        }
                    }

                    if ((s.keysHeld.has(' ') || s.keysHeld.has('j') || s.keysHeld.has('J')) && s.player.shootCooldown <= 0) {
                        fireBullet(s.player);
                    }
                }

                // ── Enemy Spawn & Update ──
                if (s.freezeTimer > 0) {
                    s.freezeTimer -= dt;
                } else {
                    s.enemySpawnTimer -= dt;
                    if (s.enemySpawnTimer <= 0) {
                        spawnEnemy();
                        s.enemySpawnTimer = 2.0 + Math.random() * 2.0;
                    }

                    for (const e of s.enemies) {
                        if (!e.active) continue;
                        e.shootCooldown -= dt;
                        e.moveTimer -= dt;

                        if (e.moveTimer <= 0) {
                            e.moveTimer = 1.0 + Math.random() * 1.5;
                            // 40% chance bias towards HQ base (downwards)
                            if (Math.random() < 0.4) {
                                e.dir = 'down';
                            } else {
                                const dirs: Direction[] = ['up', 'right', 'down', 'left'];
                                e.dir = dirs[Math.floor(Math.random() * dirs.length)];
                            }
                        }

                        const dVec = DIR_VECTORS[e.dir];
                        const nx = e.x + dVec.x * (e.speed * dt);
                        const ny = e.y + dVec.y * (e.speed * dt);

                        if (!checkTileCollision(nx + 2, ny + 2, TILE_SIZE - 4)) {
                            e.x = nx;
                            e.y = ny;
                        } else {
                            e.moveTimer = 0; // Turn on hit
                        }

                        if (e.shootCooldown <= 0) {
                            fireBullet(e);
                        }
                    }
                }

                // ── Bullets Update ──
                for (const b of s.bullets) {
                    if (!b.active) continue;
                    const dVec = DIR_VECTORS[b.dir];
                    b.x += dVec.x * (b.speed * dt);
                    b.y += dVec.y * (b.speed * dt);

                    // Out of bounds
                    if (b.x < BOARD_X || b.x > BOARD_X + MAP_COLS * TILE_SIZE ||
                        b.y < BOARD_Y || b.y > BOARD_Y + MAP_ROWS * TILE_SIZE) {
                        b.active = false;
                        continue;
                    }

                    // Tile collision
                    const col = Math.floor((b.x - BOARD_X) / TILE_SIZE);
                    const row = Math.floor((b.y - BOARD_Y) / TILE_SIZE);
                    if (col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS) {
                        const t = s.map[row][col];
                        if (t === 'brick' || t === 'steel' || t === 'baseCore') {
                            damageTileAt(col, row, b.fromPlayer && s.weaponLevel >= 4);
                            b.active = false;
                            continue;
                        }
                    }

                    // Player Hit
                    if (!b.fromPlayer && s.player.active && s.player.shieldTimer <= 0) {
                        if (Math.hypot(b.x - (s.player.x + TILE_SIZE / 2), b.y - (s.player.y + TILE_SIZE / 2)) < TILE_SIZE * 0.45) {
                            b.active = false;
                            s.player.hp--;
                            if (s.player.hp <= 0) {
                                TankAudio.explosion();
                                spawnParticles(s.player.x + TILE_SIZE / 2, s.player.y + TILE_SIZE / 2, '#ef4444', 30, 220);
                                s.lives--;
                                setLives(s.lives);
                                if (s.lives > 0) {
                                    s.player.x = BOARD_X + 6 * TILE_SIZE;
                                    s.player.y = BOARD_Y + 17 * TILE_SIZE;
                                    s.player.hp = 1;
                                    s.player.shieldTimer = 3;
                                    s.weaponLevel = Math.max(1, s.weaponLevel - 1);
                                    setWeaponLevel(s.weaponLevel);
                                } else {
                                    s.player.active = false;
                                    s.gameState = 'gameover';
                                    setGameState('gameover');
                                    TankAudio.gameOver();
                                }
                            }
                            continue;
                        }
                    }

                    // Enemy Hit
                    if (b.fromPlayer) {
                        for (const e of s.enemies) {
                            if (!e.active) continue;
                            if (Math.hypot(b.x - (e.x + TILE_SIZE / 2), b.y - (e.y + TILE_SIZE / 2)) < TILE_SIZE * 0.45) {
                                b.active = false;
                                e.hp--;
                                TankAudio.hit();
                                spawnParticles(b.x, b.y, '#f59e0b', 8, 120);

                                if (e.hp <= 0) {
                                    e.active = false;
                                    TankAudio.explosion();
                                    spawnParticles(e.x + TILE_SIZE / 2, e.y + TILE_SIZE / 2, '#ef4444', 25, 200);
                                    const pts = e.enemyType === 'heavy' ? 300 : e.enemyType === 'assault' ? 200 : 100;
                                    s.score += pts;
                                    setScore(s.score);
                                    addFloatingText(e.x + TILE_SIZE / 2, e.y, `+${pts}`, '#00f0ff');

                                    if (e.hasPowerUp) {
                                        const pTypes: PowerUpType[] = ['star', 'shield', 'bomb', 'freeze', 'fortress'];
                                        s.powerUps.push({
                                            x: e.x,
                                            y: e.y,
                                            type: pTypes[Math.floor(Math.random() * pTypes.length)],
                                            lifeTimer: 15,
                                            active: true,
                                        });
                                    }
                                }
                                break;
                            }
                        }
                    }
                }

                // ── PowerUps Collection ──
                for (const p of s.powerUps) {
                    if (!p.active) continue;
                    p.lifeTimer -= dt;
                    if (p.lifeTimer <= 0) {
                        p.active = false;
                        continue;
                    }

                    if (s.player.active && Math.hypot((s.player.x + TILE_SIZE / 2) - (p.x + TILE_SIZE / 2), (s.player.y + TILE_SIZE / 2) - (p.y + TILE_SIZE / 2)) < TILE_SIZE * 0.6) {
                        applyPowerUp(p.type);
                        p.active = false;
                    }
                }

                // Cleanup
                s.bullets = s.bullets.filter(b => b.active);
                s.enemies = s.enemies.filter(e => e.active);
                s.powerUps = s.powerUps.filter(p => p.active);

                // Stage Complete
                if (s.enemiesSpawned >= s.enemiesRemaining && s.enemies.length === 0) {
                    s.stage++;
                    s.score += 2000;
                    setScore(s.score);
                    TankAudio.stageClear();
                    loadMap(s.stage);
                }

                if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    localStorage.setItem('tank_defense_highscore', s.score.toString());
                }
            }

            // ── RENDER SCENE ────────────────────────────────────────────────
            renderGameScene(ctx, s, crtEnabled);
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled, spawnEnemy, applyPowerUp, damageTileAt, loadMap]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            stateRef.current.keysHeld.add(e.key);
            if (e.key === ' ' || e.key === 'j' || e.key === 'J') {
                if (stateRef.current.gameState === 'playing' && stateRef.current.player.active && stateRef.current.player.shootCooldown <= 0) {
                    fireBullet(stateRef.current.player);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            stateRef.current.keysHeld.delete(e.key);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative h-[74vh] max-h-[800px] min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none"
            />

            {/* Top HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(0,240,255,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">SCORE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-bold">HIGH</div>
                        <div className="text-base sm:text-lg font-black text-amber-400 tabular-nums">{highScore}</div>
                    </div>
                    <div className="bg-black/85 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">LIVES</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{lives}</div>
                    </div>
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">STAGE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{stage}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-lg transition-all ${crtEnabled ? 'border-cyan-400 text-cyan-400 bg-cyan-950/60' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                {/* D-Pad */}
                <div className="grid grid-cols-3 gap-1 bg-black/70 p-2 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <div />
                    <button
                        onTouchStart={() => { stateRef.current.touchMoveDir = 'up'; }}
                        onTouchEnd={() => { stateRef.current.touchMoveDir = null; }}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                    <div />
                    <button
                        onTouchStart={() => { stateRef.current.touchMoveDir = 'left'; }}
                        onTouchEnd={() => { stateRef.current.touchMoveDir = null; }}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onTouchStart={() => { stateRef.current.touchMoveDir = 'down'; }}
                        onTouchEnd={() => { stateRef.current.touchMoveDir = null; }}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                        onTouchStart={() => { stateRef.current.touchMoveDir = 'right'; }}
                        onTouchEnd={() => { stateRef.current.touchMoveDir = null; }}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Fire Button */}
                <button
                    onClick={() => {
                        if (stateRef.current.player.active && stateRef.current.player.shootCooldown <= 0) {
                            fireBullet(stateRef.current.player);
                        }
                    }}
                    className="p-6 bg-gradient-to-tr from-amber-500 to-red-500 rounded-2xl text-black font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95 transition-all pointer-events-auto"
                >
                    <Flame className="w-7 h-7" />
                </button>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'playing' && gameState !== 'briefing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Tactical Arcade</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 BASE DESTROYED' : 'TANKS DEFENSE 🛡️'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Tu base o tanque han sido destruidos en la etapa ${stage}. Puntuación final: ${score}`
                                : 'Defiende tu cuartel general (🦅 HQ) del asedio enemigo. Destruye ladrillos, recoge estrellas y neutraliza a los panzers blindados.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'REINTENTAR MISIÓN 🔄' : 'DESPLEGAR TANQUE 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
