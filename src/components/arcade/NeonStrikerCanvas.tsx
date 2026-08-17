'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StrikerAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Bomb, Tv, Shield, Zap, Sparkles, Crosshair } from 'lucide-react';

interface NeonStrikerProps {
    accentColor?: string;
}

const V_WIDTH = 540;
const V_HEIGHT = 800;

interface Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    isPlayer: boolean;
    damage: number;
    isMissile?: boolean;
    homingTarget?: Enemy | null;
    trail?: { x: number; y: number }[];
}

interface Enemy {
    id: number;
    type: 'scout' | 'gunship' | 'interceptor' | 'cruiser' | 'boss';
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    scoreVal: number;
    shootTimer: number;
    shootInterval: number;
    patternPhase: number;
    color: string;
    bossPhase?: number;
}

interface Particle {
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

interface PowerUp {
    x: number;
    y: number;
    vy: number;
    type: 'weapon' | 'shield' | 'bomb' | 'missile' | 'coin';
    radius: number;
}

interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    maxLife: number;
}

export function NeonStrikerCanvas({ accentColor = '#00f0ff' }: NeonStrikerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [wave, setWave] = useState(1);
    const [lives, setLives] = useState(3);
    const [bombs, setBombs] = useState(2);
    const [weaponLevel, setWeaponLevel] = useState(1);
    const [hasShield, setHasShield] = useState(false);
    const [hyperMeter, setHyperMeter] = useState(0);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'victory'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        player: {
            x: V_WIDTH / 2,
            y: V_HEIGHT - 120,
            vx: 0,
            vy: 0,
            width: 36,
            height: 42,
            speed: 380,
            weaponLevel: 1,
            hasShield: false,
            invulnerableTime: 0,
            tilt: 0,
            shootCooldown: 0,
            missileCooldown: 0,
            orbitAngle: 0,
        },
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false,
            focus: false,
        },
        touchPos: null as { x: number; y: number } | null,
        bullets: [] as Bullet[],
        enemies: [] as Enemy[],
        particles: [] as Particle[],
        powerups: [] as PowerUp[],
        floatingTexts: [] as FloatingText[],
        stars: [] as { x: number; y: number; speed: number; size: number; alpha: number; color: string }[],
        wave: 1,
        waveTimer: 0,
        waveEnemiesRemaining: 0,
        bossActive: false,
        bossHp: 0,
        bossMaxHp: 0,
        score: 0,
        highScore: 0,
        lives: 3,
        bombs: 2,
        hyperMeter: 0,
        grazeCount: 0,
        multiplier: 1,
        multiplierTimer: 0,
        shakeTime: 0,
        shakeIntensity: 0,
        hyperBombEffect: 0,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover' | 'victory',
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('neon_striker_highscore');
        if (saved) {
            const val = parseInt(saved, 10);
            setHighScore(val);
            stateRef.current.highScore = val;
        }

        // Initialize Starfield
        const stars = [];
        for (let i = 0; i < 90; i++) {
            stars.push({
                x: Math.random() * V_WIDTH,
                y: Math.random() * V_HEIGHT,
                speed: 30 + Math.random() * 140,
                size: 1 + Math.random() * 2.2,
                alpha: 0.2 + Math.random() * 0.8,
                color: Math.random() > 0.6 ? '#00f0ff' : Math.random() > 0.3 ? '#ff007f' : '#ffffff',
            });
        }
        stateRef.current.stars = stars;
    }, []);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const addShake = (intensity = 8, duration = 0.25) => {
        const s = stateRef.current;
        s.shakeIntensity = Math.max(s.shakeIntensity, intensity);
        s.shakeTime = Math.max(s.shakeTime, duration);
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#ffff00') => {
        stateRef.current.floatingTexts.push({
            x,
            y,
            text,
            color,
            life: 0.8,
            maxLife: 0.8,
        });
    };

    const spawnExplosion = (x: number, y: number, color = '#ff0055', count = 24, size = 3) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 260;
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: size * (0.6 + Math.random() * 0.8),
                color: Math.random() > 0.4 ? color : '#fef08a',
                life: 0.3 + Math.random() * 0.45,
                maxLife: 0.75,
                alpha: 1.0,
            });
        }
    };

    const triggerHyperBomb = useCallback(() => {
        const s = stateRef.current;
        if (s.bombs <= 0 && s.hyperMeter < 100) return;
        if (s.gameState !== 'playing') return;

        if (s.hyperMeter >= 100) {
            s.hyperMeter = 0;
            setHyperMeter(0);
        } else {
            s.bombs--;
            setBombs(s.bombs);
        }

        s.hyperBombEffect = 0.8;
        addShake(20, 0.6);
        StrikerAudio.bomb();

        // Obliterate all enemy bullets
        s.bullets = s.bullets.filter(b => b.isPlayer);

        // Damage all enemies on screen
        s.enemies.forEach(e => {
            e.hp -= 500;
            spawnExplosion(e.x, e.y, '#ff007f', 16, 4);
        });

        addFloatingText(V_WIDTH / 2, V_HEIGHT / 2, '💥 HYPER BOMB DISCHARGE!', '#00f0ff');
    }, []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;

        s.player = {
            x: V_WIDTH / 2,
            y: V_HEIGHT - 120,
            vx: 0,
            vy: 0,
            width: 36,
            height: 42,
            speed: 380,
            weaponLevel: 1,
            hasShield: false,
            invulnerableTime: 2.0,
            tilt: 0,
            shootCooldown: 0,
            missileCooldown: 0,
            orbitAngle: 0,
        };

        s.bullets = [];
        s.enemies = [];
        s.particles = [];
        s.powerups = [];
        s.floatingTexts = [];
        s.wave = 1;
        s.waveTimer = 0.5;
        s.bossActive = false;
        s.score = 0;
        s.lives = 3;
        s.bombs = 2;
        s.hyperMeter = 0;
        s.grazeCount = 0;
        s.multiplier = 1;
        s.gameState = 'playing';

        setScore(0);
        setWave(1);
        setLives(3);
        setBombs(2);
        setWeaponLevel(1);
        setHasShield(false);
        setHyperMeter(0);
        setGameState('playing');

        StrikerAudio.waveCleared();
    }, []);

    const spawnWave = (waveNum: number) => {
        const s = stateRef.current;
        s.enemies = [];

        if (waveNum % 5 === 0) {
            // Boss Wave
            s.bossActive = true;
            s.bossMaxHp = 2500 + waveNum * 600;
            s.bossHp = s.bossMaxHp;
            s.enemies.push({
                id: Math.random(),
                type: 'boss',
                x: V_WIDTH / 2,
                y: -90,
                vx: 0,
                vy: 60,
                width: 140,
                height: 90,
                hp: s.bossHp,
                maxHp: s.bossMaxHp,
                scoreVal: 10000,
                shootTimer: 0,
                shootInterval: 0.18,
                patternPhase: 0,
                color: '#ff0055',
                bossPhase: 1,
            });
            StrikerAudio.bossAlarm();
            addFloatingText(V_WIDTH / 2, V_HEIGHT / 3, '⚠️ ALERTA: DREADNOUGHT NEXUS-9 ⚠️', '#ff0055');
            return;
        }

        s.bossActive = false;
        const enemyCount = 8 + waveNum * 3;
        s.waveEnemiesRemaining = enemyCount;

        for (let i = 0; i < enemyCount; i++) {
            const isHeavy = i % 4 === 0 && waveNum > 1;
            const isInterceptor = i % 3 === 0 && waveNum > 2;

            const type = isHeavy ? 'gunship' : isInterceptor ? 'interceptor' : 'scout';
            const hp = isHeavy ? 120 + waveNum * 20 : isInterceptor ? 60 + waveNum * 10 : 35 + waveNum * 5;
            const scoreVal = isHeavy ? 500 : isInterceptor ? 300 : 150;

            s.enemies.push({
                id: Math.random(),
                type,
                x: 60 + (i % 6) * ((V_WIDTH - 120) / 5),
                y: -50 - Math.floor(i / 6) * 90 - (i % 2) * 30,
                vx: (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 50),
                vy: 55 + Math.random() * 45,
                width: isHeavy ? 52 : isInterceptor ? 40 : 32,
                height: isHeavy ? 46 : isInterceptor ? 36 : 30,
                hp,
                maxHp: hp,
                scoreVal,
                shootTimer: 0.5 + Math.random() * 1.5,
                shootInterval: isHeavy ? 1.2 : 1.8,
                patternPhase: Math.random() * Math.PI * 2,
                color: isHeavy ? '#a855f7' : isInterceptor ? '#06b6d4' : '#f43f5e',
            });
        }
    };

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

            // 1. Shake & Screen FX update
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }
            if (s.hyperBombEffect > 0) {
                s.hyperBombEffect -= dt * 1.8;
            }

            // 2. Starfield update
            s.stars.forEach(st => {
                st.y += st.speed * dt;
                if (st.y > V_HEIGHT) {
                    st.y = 0;
                    st.x = Math.random() * V_WIDTH;
                }
            });

            if (s.gameState === 'playing') {
                const p = s.player;

                // Multiplier timer decay
                if (s.multiplierTimer > 0) {
                    s.multiplierTimer -= dt;
                    if (s.multiplierTimer <= 0) s.multiplier = 1;
                }

                if (p.invulnerableTime > 0) p.invulnerableTime -= dt;

                // ── Player Controls & Movement ──
                let moveX = 0;
                let moveY = 0;

                if (s.touchPos) {
                    // Direct touch follow
                    const dx = s.touchPos.x - p.x;
                    const dy = (s.touchPos.y - 45) - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 5) {
                        moveX = (dx / dist) * Math.min(dist * 12, p.speed);
                        moveY = (dy / dist) * Math.min(dist * 12, p.speed);
                    }
                } else {
                    const speed = s.keys.focus ? p.speed * 0.45 : p.speed;
                    if (s.keys.left) moveX -= speed;
                    if (s.keys.right) moveX += speed;
                    if (s.keys.up) moveY -= speed;
                    if (s.keys.down) moveY += speed;
                }

                p.x = Math.max(p.width / 2 + 8, Math.min(V_WIDTH - p.width / 2 - 8, p.x + moveX * dt));
                p.y = Math.max(p.height / 2 + 16, Math.min(V_HEIGHT - p.height / 2 - 16, p.y + moveY * dt));

                // Banking tilt
                p.tilt = moveX < -10 ? -0.22 : moveX > 10 ? 0.22 : p.tilt * 0.85;
                p.orbitAngle += dt * 3.5;

                // Engine exhaust particles
                if (Math.random() > 0.2) {
                    s.particles.push({
                        x: p.x + (Math.random() * 8 - 4),
                        y: p.y + p.height / 2 - 4,
                        vx: (Math.random() * 20 - 10),
                        vy: 140 + Math.random() * 80,
                        radius: 2.5 + Math.random() * 2,
                        color: Math.random() > 0.4 ? '#00f0ff' : '#38bdf8',
                        life: 0.18,
                        maxLife: 0.18,
                        alpha: 0.9,
                    });
                }

                // ── Player Shooting ──
                p.shootCooldown -= dt;
                p.missileCooldown -= dt;

                const shouldFire = s.touchPos !== null || s.keys.fire || true; // Auto-fire enabled for arcade action

                if (shouldFire && p.shootCooldown <= 0) {
                    p.shootCooldown = p.weaponLevel >= 4 ? 0.08 : 0.11;
                    StrikerAudio.laser(p.weaponLevel);

                    const lvl = p.weaponLevel;
                    if (lvl === 1) {
                        s.bullets.push(
                            { x: p.x - 9, y: p.y - 18, vx: 0, vy: -750, radius: 4, color: '#00f0ff', isPlayer: true, damage: 25 },
                            { x: p.x + 9, y: p.y - 18, vx: 0, vy: -750, radius: 4, color: '#00f0ff', isPlayer: true, damage: 25 }
                        );
                    } else if (lvl === 2) {
                        s.bullets.push(
                            { x: p.x, y: p.y - 20, vx: 0, vy: -800, radius: 5, color: '#38bdf8', isPlayer: true, damage: 32 },
                            { x: p.x - 12, y: p.y - 14, vx: -90, vy: -780, radius: 4, color: '#00f0ff', isPlayer: true, damage: 25 },
                            { x: p.x + 12, y: p.y - 14, vx: 90, vy: -780, radius: 4, color: '#00f0ff', isPlayer: true, damage: 25 }
                        );
                    } else if (lvl === 3) {
                        s.bullets.push(
                            { x: p.x - 6, y: p.y - 20, vx: -20, vy: -820, radius: 5, color: '#38bdf8', isPlayer: true, damage: 35 },
                            { x: p.x + 6, y: p.y - 20, vx: 20, vy: -820, radius: 5, color: '#38bdf8', isPlayer: true, damage: 35 },
                            { x: p.x - 16, y: p.y - 12, vx: -160, vy: -760, radius: 4, color: '#a855f7', isPlayer: true, damage: 28 },
                            { x: p.x + 16, y: p.y - 12, vx: 160, vy: -760, radius: 4, color: '#a855f7', isPlayer: true, damage: 28 }
                        );
                    } else if (lvl >= 4) {
                        // 5-Way Plasma Storm
                        for (let i = -2; i <= 2; i++) {
                            s.bullets.push({
                                x: p.x + i * 8,
                                y: p.y - 18,
                                vx: i * 110,
                                vy: -820,
                                radius: 5,
                                color: i === 0 ? '#facc15' : '#00f0ff',
                                isPlayer: true,
                                damage: i === 0 ? 45 : 30,
                            });
                        }

                        // Orbiting Satellite Bit Drones firing
                        const bit1X = p.x + Math.cos(p.orbitAngle) * 36;
                        const bit1Y = p.y + Math.sin(p.orbitAngle) * 36;
                        const bit2X = p.x + Math.cos(p.orbitAngle + Math.PI) * 36;
                        const bit2Y = p.y + Math.sin(p.orbitAngle + Math.PI) * 36;

                        s.bullets.push(
                            { x: bit1X, y: bit1Y, vx: 0, vy: -850, radius: 3.5, color: '#ec4899', isPlayer: true, damage: 20 },
                            { x: bit2X, y: bit2Y, vx: 0, vy: -850, radius: 3.5, color: '#ec4899', isPlayer: true, damage: 20 }
                        );
                    }
                }

                // Homing Micro-Missiles for Weapon Level >= 3
                if (p.weaponLevel >= 3 && p.missileCooldown <= 0 && s.enemies.length > 0) {
                    p.missileCooldown = 0.55;
                    StrikerAudio.missile();
                    const target = s.enemies[0];
                    s.bullets.push(
                        { x: p.x - 22, y: p.y, vx: -180, vy: -200, radius: 4.5, color: '#fb923c', isPlayer: true, damage: 60, isMissile: true, homingTarget: target, trail: [] },
                        { x: p.x + 22, y: p.y, vx: 180, vy: -200, radius: 4.5, color: '#fb923c', isPlayer: true, damage: 60, isMissile: true, homingTarget: target, trail: [] }
                    );
                }

                // ── Wave Spawning ──
                if (s.enemies.length === 0) {
                    s.waveTimer -= dt;
                    if (s.waveTimer <= 0) {
                        s.wave++;
                        setWave(s.wave);
                        spawnWave(s.wave);
                        s.waveTimer = 3.0;
                    }
                }

                // ── Enemy AI & Patterns ──
                s.enemies.forEach(e => {
                    e.patternPhase += dt * 2.5;

                    if (e.type === 'boss') {
                        // Boss entrance
                        if (e.y < 120) {
                            e.y += e.vy * dt;
                        } else {
                            e.x += Math.sin(e.patternPhase * 0.8) * 110 * dt;
                        }

                        // Boss Attack Patterns
                        e.shootTimer -= dt;
                        if (e.shootTimer <= 0) {
                            e.shootTimer = 0.16;

                            // Spiral Bullet Ring
                            const ringCount = 12;
                            const baseAngle = e.patternPhase * 1.5;
                            for (let k = 0; k < ringCount; k++) {
                                const ang = baseAngle + (k * Math.PI * 2) / ringCount;
                                s.bullets.push({
                                    x: e.x,
                                    y: e.y + 35,
                                    vx: Math.cos(ang) * 180,
                                    vy: Math.sin(ang) * 180,
                                    radius: 4.5,
                                    color: '#ff007f',
                                    isPlayer: false,
                                    damage: 1,
                                });
                            }

                            // Directed Dual Laser Cannons
                            if (Math.sin(e.patternPhase * 3) > 0.7) {
                                s.bullets.push(
                                    { x: e.x - 45, y: e.y + 30, vx: 0, vy: 360, radius: 5.5, color: '#a855f7', isPlayer: false, damage: 1 },
                                    { x: e.x + 45, y: e.y + 30, vx: 0, vy: 360, radius: 5.5, color: '#a855f7', isPlayer: false, damage: 1 }
                                );
                            }
                        }
                    } else {
                        // Standard enemies
                        e.y += e.vy * dt;
                        if (e.type === 'scout') {
                            e.x += Math.sin(e.patternPhase) * 120 * dt;
                        } else if (e.type === 'interceptor') {
                            // Fast diagonal dash
                            e.x += e.vx * dt;
                            if (e.x < 30 || e.x > V_WIDTH - 30) e.vx = -e.vx;
                        } else if (e.type === 'gunship') {
                            e.x += Math.cos(e.patternPhase * 0.7) * 70 * dt;
                        }

                        // Enemy Shooting
                        e.shootTimer -= dt;
                        if (e.shootTimer <= 0 && e.y > 20 && e.y < V_HEIGHT - 100) {
                            e.shootTimer = e.shootInterval;
                            StrikerAudio.enemyHit();

                            const dx = p.x - e.x;
                            const dy = p.y - e.y;
                            const angle = Math.atan2(dy, dx);
                            const bSpeed = 240;

                            if (e.type === 'gunship') {
                                // 3-way spread
                                for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
                                    s.bullets.push({
                                        x: e.x,
                                        y: e.y + e.height / 2,
                                        vx: Math.cos(angle + offset) * bSpeed,
                                        vy: Math.sin(angle + offset) * bSpeed,
                                        radius: 4,
                                        color: '#ec4899',
                                        isPlayer: false,
                                        damage: 1,
                                    });
                                }
                            } else {
                                s.bullets.push({
                                    x: e.x,
                                    y: e.y + e.height / 2,
                                    vx: Math.cos(angle) * bSpeed,
                                    vy: Math.sin(angle) * bSpeed,
                                    radius: 3.8,
                                    color: '#f43f5e',
                                    isPlayer: false,
                                    damage: 1,
                                });
                            }
                        }
                    }
                });

                // Remove off-screen enemies
                s.enemies = s.enemies.filter(e => e.y < V_HEIGHT + 100);

                // ── Bullet Updates & Collisions ──
                s.bullets.forEach(b => {
                    if (b.isMissile && b.homingTarget && b.homingTarget.hp > 0) {
                        const dx = b.homingTarget.x - b.x;
                        const dy = b.homingTarget.y - b.y;
                        const angle = Math.atan2(dy, dx);
                        b.vx += Math.cos(angle) * 750 * dt;
                        b.vy += Math.sin(angle) * 750 * dt;
                        const spd = Math.hypot(b.vx, b.vy);
                        if (spd > 550) {
                            b.vx = (b.vx / spd) * 550;
                            b.vy = (b.vy / spd) * 550;
                        }
                    }

                    b.x += b.vx * dt;
                    b.y += b.vy * dt;

                    // Missile smoke trails
                    if (b.isMissile && Math.random() > 0.3) {
                        s.particles.push({
                            x: b.x,
                            y: b.y,
                            vx: (Math.random() * 20 - 10),
                            vy: 30 + Math.random() * 20,
                            radius: 2.2,
                            color: '#fdba74',
                            life: 0.2,
                            maxLife: 0.2,
                            alpha: 0.8,
                        });
                    }

                    // Graze detection for enemy bullets
                    if (!b.isPlayer && p.invulnerableTime <= 0) {
                        const distToPlayer = Math.hypot(b.x - p.x, b.y - p.y);
                        if (distToPlayer < 24 && distToPlayer > p.width / 2) {
                            s.grazeCount++;
                            s.multiplier = Math.min(10, s.multiplier + 0.1);
                            s.multiplierTimer = 2.5;
                            s.hyperMeter = Math.min(100, s.hyperMeter + 1.2);
                            setHyperMeter(Math.round(s.hyperMeter));
                            StrikerAudio.graze();
                            addFloatingText(b.x, b.y - 10, 'GRAZE +50', '#a855f7');
                            s.score += Math.round(50 * s.multiplier);
                            setScore(s.score);
                        }
                    }
                });

                // Bullet vs Enemy Collision
                s.bullets = s.bullets.filter(b => {
                    if (b.y < -30 || b.y > V_HEIGHT + 30 || b.x < -30 || b.x > V_WIDTH + 30) return false;

                    if (b.isPlayer) {
                        for (const e of s.enemies) {
                            const hit =
                                b.x > e.x - e.width / 2 &&
                                b.x < e.x + e.width / 2 &&
                                b.y > e.y - e.height / 2 &&
                                b.y < e.y + e.height / 2;

                            if (hit) {
                                e.hp -= b.damage;
                                spawnExplosion(b.x, b.y, b.color, 4, 2);

                                if (e.hp <= 0) {
                                    // Enemy Destroyed
                                    const isBoss = e.type === 'boss';
                                    StrikerAudio.explosion(isBoss);
                                    spawnExplosion(e.x, e.y, e.color, isBoss ? 60 : 25, isBoss ? 5 : 3.5);
                                    addShake(isBoss ? 16 : 5, 0.35);

                                    const pts = Math.round(e.scoreVal * s.multiplier);
                                    s.score += pts;
                                    setScore(s.score);
                                    if (s.score > s.highScore) {
                                        s.highScore = s.score;
                                        setHighScore(s.score);
                                        localStorage.setItem('neon_striker_highscore', s.score.toString());
                                    }

                                    addFloatingText(e.x, e.y, `+${pts}`, '#facc15');

                                    // Power-up drops
                                    if (Math.random() < 0.28 || isBoss) {
                                        const pTypes: PowerUp['type'][] = ['weapon', 'shield', 'bomb', 'missile', 'coin'];
                                        const pickedType = isBoss
                                            ? 'weapon'
                                            : pTypes[Math.floor(Math.random() * pTypes.length)];
                                        s.powerups.push({
                                            x: e.x,
                                            y: e.y,
                                            vy: 90,
                                            type: pickedType,
                                            radius: 12,
                                        });
                                    }
                                }
                                return false; // Consume bullet
                            }
                        }
                    } else if (p.invulnerableTime <= 0) {
                        // Hostile bullet vs Player
                        const hitPlayer = Math.hypot(b.x - p.x, b.y - p.y) < p.width / 2.2;
                        if (hitPlayer) {
                            if (p.hasShield) {
                                p.hasShield = false;
                                setHasShield(false);
                                p.invulnerableTime = 1.2;
                                StrikerAudio.shieldHit();
                                spawnExplosion(p.x, p.y, '#00f0ff', 20, 3);
                                addFloatingText(p.x, p.y - 20, 'ESCUDO ROTO!', '#00f0ff');
                            } else {
                                // Lose life
                                s.lives--;
                                setLives(s.lives);
                                p.weaponLevel = Math.max(1, p.weaponLevel - 1);
                                setWeaponLevel(p.weaponLevel);
                                p.invulnerableTime = 2.5;
                                StrikerAudio.explosion(true);
                                addShake(18, 0.5);
                                spawnExplosion(p.x, p.y, '#ff0055', 40, 4);

                                if (s.lives <= 0) {
                                    s.gameState = 'gameover';
                                    setGameState('gameover');
                                }
                            }
                            return false;
                        }
                    }
                    return true;
                });

                // Remove dead enemies
                s.enemies = s.enemies.filter(e => e.hp > 0);

                // ── Power-Up Collection ──
                s.powerups = s.powerups.filter(pu => {
                    pu.y += pu.vy * dt;
                    const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
                    if (dist < pu.radius + p.width / 2) {
                        StrikerAudio.powerup();
                        if (pu.type === 'weapon') {
                            p.weaponLevel = Math.min(5, p.weaponLevel + 1);
                            setWeaponLevel(p.weaponLevel);
                            addFloatingText(pu.x, pu.y, 'POWER UP! ⚡', '#facc15');
                        } else if (pu.type === 'shield') {
                            p.hasShield = true;
                            setHasShield(true);
                            addFloatingText(pu.x, pu.y, 'SHIELD +1 🛡️', '#00f0ff');
                        } else if (pu.type === 'bomb') {
                            s.bombs = Math.min(5, s.bombs + 1);
                            setBombs(s.bombs);
                            addFloatingText(pu.x, pu.y, 'HYPER BOMB +1 💣', '#ec4899');
                        } else if (pu.type === 'missile') {
                            p.weaponLevel = Math.max(3, p.weaponLevel);
                            setWeaponLevel(p.weaponLevel);
                            addFloatingText(pu.x, pu.y, 'MISSILES ARMED 🚀', '#fb923c');
                        } else if (pu.type === 'coin') {
                            s.score += 1000;
                            setScore(s.score);
                            addFloatingText(pu.x, pu.y, '+1000 COIN 💎', '#38bdf8');
                        }
                        return false;
                    }
                    return pu.y < V_HEIGHT + 30;
                });
            }

            // ── Update Particles & Floating Text ──
            s.particles.forEach(pt => {
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.life -= dt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            s.floatingTexts.forEach(ft => {
                ft.y -= 35 * dt;
                ft.life -= dt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // ── 3. RENDER SCENE ──────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            // Camera Shake
            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Deep Space Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#04020a');
            bgGrad.addColorStop(0.6, '#09041a');
            bgGrad.addColorStop(1, '#110626');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Parallax Starfield
            s.stars.forEach(st => {
                ctx.fillStyle = st.color;
                ctx.globalAlpha = st.alpha;
                ctx.beginPath();
                ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // Hyper Bomb Shockwave Ripple
            if (s.hyperBombEffect > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(0, 240, 255, ${s.hyperBombEffect})`;
                ctx.lineWidth = 14 * s.hyperBombEffect;
                ctx.beginPath();
                ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, (1.0 - s.hyperBombEffect) * V_HEIGHT * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Render Power-Ups
            s.powerups.forEach(pu => {
                ctx.save();
                ctx.translate(pu.x, pu.y);
                const col =
                    pu.type === 'weapon'
                        ? '#facc15'
                        : pu.type === 'shield'
                        ? '#00f0ff'
                        : pu.type === 'bomb'
                        ? '#ec4899'
                        : pu.type === 'missile'
                        ? '#fb923c'
                        : '#38bdf8';

                ctx.shadowColor = col;
                ctx.shadowBlur = 12;
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
                ctx.fill();

                // Icon label inside
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const label =
                    pu.type === 'weapon'
                        ? 'P'
                        : pu.type === 'shield'
                        ? 'S'
                        : pu.type === 'bomb'
                        ? 'B'
                        : pu.type === 'missile'
                        ? 'M'
                        : '$';
                ctx.fillText(label, 0, 0);
                ctx.restore();
            });

            // Render Bullets
            s.bullets.forEach(b => {
                ctx.save();
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 8;

                if (b.isMissile) {
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            // Render Enemies
            s.enemies.forEach(e => {
                ctx.save();
                ctx.translate(e.x, e.y);

                if (e.type === 'boss') {
                    // Dreadnought Nexus-9 Boss Ship
                    ctx.shadowColor = '#ff0055';
                    ctx.shadowBlur = 16;
                    ctx.fillStyle = '#1e102d';
                    ctx.strokeStyle = '#ff0055';
                    ctx.lineWidth = 2.5;

                    // Main Hull
                    ctx.beginPath();
                    ctx.moveTo(0, 45);
                    ctx.lineTo(65, 10);
                    ctx.lineTo(55, -45);
                    ctx.lineTo(0, -30);
                    ctx.lineTo(-55, -45);
                    ctx.lineTo(-65, 10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Glowing Core
                    ctx.fillStyle = Math.sin(time * 0.01) > 0 ? '#ff007f' : '#facc15';
                    ctx.beginPath();
                    ctx.arc(0, 5, 16, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Standard Enemy Ship
                    ctx.shadowColor = e.color;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#130c22';
                    ctx.strokeStyle = e.color;
                    ctx.lineWidth = 2;

                    ctx.beginPath();
                    ctx.moveTo(0, e.height / 2);
                    ctx.lineTo(e.width / 2, -e.height / 2);
                    ctx.lineTo(0, -e.height / 3);
                    ctx.lineTo(-e.width / 2, -e.height / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // Enemy Health Bar (if damaged)
                if (e.hp < e.maxHp) {
                    const barW = e.width * 0.9;
                    const hpRatio = Math.max(0, e.hp / e.maxHp);
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(-barW / 2, -e.height / 2 - 10, barW, 4);
                    ctx.fillStyle = e.type === 'boss' ? '#ff0055' : '#22c55e';
                    ctx.fillRect(-barW / 2, -e.height / 2 - 10, barW * hpRatio, 4);
                }

                ctx.restore();
            });

            // Render Player Ship (Aegis Starfighter)
            if (s.gameState === 'playing') {
                const p = s.player;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.tilt);

                const isBlinking = p.invulnerableTime > 0 && Math.floor(time / 80) % 2 === 0;

                if (!isBlinking) {
                    // Starfighter Hull
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 14;
                    ctx.fillStyle = '#0a1026';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2.2;

                    ctx.beginPath();
                    ctx.moveTo(0, -22);
                    ctx.lineTo(18, 16);
                    ctx.lineTo(8, 12);
                    ctx.lineTo(0, 18);
                    ctx.lineTo(-8, 12);
                    ctx.lineTo(-18, 16);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Cockpit Canopy
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath();
                    ctx.moveTo(0, -12);
                    ctx.lineTo(4, 2);
                    ctx.lineTo(-4, 2);
                    ctx.closePath();
                    ctx.fill();

                    // Shield Bubble
                    if (p.hasShield) {
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2.5;
                        ctx.shadowColor = '#00f0ff';
                        ctx.shadowBlur = 16;
                        ctx.beginPath();
                        ctx.arc(0, 0, 26 + Math.sin(time * 0.008) * 2, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // Orbiting Satellite Bit Drones (Level 4+)
                    if (p.weaponLevel >= 4) {
                        const bit1X = Math.cos(p.orbitAngle) * 36;
                        const bit1Y = Math.sin(p.orbitAngle) * 36;
                        const bit2X = Math.cos(p.orbitAngle + Math.PI) * 36;
                        const bit2Y = Math.sin(p.orbitAngle + Math.PI) * 36;

                        ctx.fillStyle = '#ec4899';
                        ctx.shadowColor = '#ec4899';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(bit1X, bit1Y, 5, 0, Math.PI * 2);
                        ctx.arc(bit2X, bit2Y, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            // Render Particles
            s.particles.forEach(pt => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Render Floating Text
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 12px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 6;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Scanlines
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                for (let y = 0; y < V_HEIGHT; y += 4) {
                    ctx.fillRect(0, y, V_WIDTH, 1.5);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const k = stateRef.current.keys;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
            if (e.key === ' ' || e.key === 'j' || e.key === 'J') k.fire = true;
            if (e.key === 'Shift') k.focus = true;
            if (e.key === 'k' || e.key === 'K' || e.key === 'b' || e.key === 'B') triggerHyperBomb();
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = stateRef.current.keys;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = false;
            if (e.key === ' ' || e.key === 'j' || e.key === 'J') k.fire = false;
            if (e.key === 'Shift') k.focus = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [triggerHyperBomb]);

    // Touch & Pointer Drag Listeners
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = V_WIDTH / rect.width;
        const scaleY = V_HEIGHT / rect.height;
        stateRef.current.touchPos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!stateRef.current.touchPos || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = V_WIDTH / rect.width;
        const scaleY = V_HEIGHT / rect.height;
        stateRef.current.touchPos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const handlePointerUp = () => {
        stateRef.current.touchPos = null;
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative h-[72vh] max-h-[780px] min-h-[500px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Arcade HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
                <div className="flex items-center gap-3">
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(0,240,255,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">SCORE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-bold">HIGH</div>
                        <div className="text-base sm:text-lg font-black text-amber-400 tabular-nums">{highScore}</div>
                    </div>
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">WAVE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{wave}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="text-sm font-black text-cyan-400 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10">
                        {'🚀'.repeat(lives)}
                    </div>

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

            {/* Bottom Floating Bomb & Hyper Controls */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
                {/* Hyper Bar */}
                <div className="bg-black/85 border border-white/20 px-3 py-2 rounded-2xl backdrop-blur-md pointer-events-auto flex flex-col gap-1 w-32 sm:w-44 shadow-lg">
                    <div className="flex justify-between text-[9px] font-bold text-white/70">
                        <span>HYPER OVERDRIVE</span>
                        <span className={hyperMeter >= 100 ? 'text-cyan-400 animate-pulse' : 'text-white/50'}>{hyperMeter}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/15">
                        <div
                            className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full transition-all duration-150"
                            style={{ width: `${hyperMeter}%` }}
                        />
                    </div>
                </div>

                {/* Hyper Bomb Action Button */}
                <button
                    onClick={triggerHyperBomb}
                    className={`pointer-events-auto px-4 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-2xl transition-all active:scale-90 ${
                        bombs > 0 || hyperMeter >= 100
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.6)] border border-pink-400'
                            : 'bg-black/80 text-white/30 border border-white/10'
                    }`}
                >
                    <Bomb className="w-5 h-5 text-pink-300" />
                    <span>BOMB ({bombs})</span>
                </button>
            </div>

            {/* Start / Game Over Overlay */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">Galaxy Bullet Hell Arcade</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'victory' ? '🏆 ¡GALAXIA LIBERADA!' : gameState === 'gameover' ? '💀 GAME OVER' : 'NEON STRIKER 🚀'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'victory'
                                ? `¡Has derrotado a la flota con ${score} puntos!`
                                : gameState === 'gameover'
                                ? `Has sido derribado en la Oleada ${wave}. Puntuación final: ${score}`
                                : 'Pilota el caza Aegis, esquiva las ráfagas enemigas, acumula bonus de rozadura (Graze) y desata la Hyper Bomba.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' || gameState === 'victory' ? 'JUGAR DE NUEVO 🔄' : 'DESPEGAR 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
