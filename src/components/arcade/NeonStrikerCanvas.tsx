'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StrikerAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Bomb, Tv, Shield, Zap, Sparkles, Crosshair, Trophy } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';

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
    grazed?: boolean;
}

interface Enemy {
    id: string;
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

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();

    const isMile = profile === 'ella';
    const shipName = isMile ? 'VALKYRIE-02' : 'AEGIS-01';
    const pilotName = isMile ? 'MILE' : 'SANTI';
    const pilotColor = isMile ? '#ff007f' : '#00f0ff';
    const secondaryColor = isMile ? '#f43f5e' : '#38bdf8';

    const elBest = scores['neonstriker']?.el || 0;
    const ellaBest = scores['neonstriker']?.ella || 0;

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
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    const stateRef = useRef({
        player: {
            x: V_WIDTH / 2,
            y: V_HEIGHT - 120,
            vx: 0,
            vy: 0,
            width: 38,
            height: 44,
            speed: 390,
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
        const activePb = isMile ? ellaBest : elBest;
        setHighScore(activePb);
        stateRef.current.highScore = activePb;

        // Initialize Parallax Starfield
        const stars = [];
        for (let i = 0; i < 110; i++) {
            stars.push({
                x: Math.random() * V_WIDTH,
                y: Math.random() * V_HEIGHT,
                speed: 25 + Math.random() * 160,
                size: 1 + Math.random() * 2.4,
                alpha: 0.2 + Math.random() * 0.8,
                color: Math.random() > 0.6 ? '#00f0ff' : Math.random() > 0.3 ? '#ff007f' : '#ffffff',
            });
        }
        stateRef.current.stars = stars;
    }, [isMile, elBest, ellaBest]);

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
            life: 0.85,
            maxLife: 0.85,
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

        s.hyperBombEffect = 0.85;
        addShake(22, 0.65);
        StrikerAudio.bomb();

        // Convert all enemy bullets into golden bonus coins
        s.bullets.forEach(b => {
            if (!b.isPlayer) {
                s.powerups.push({
                    x: b.x,
                    y: b.y,
                    vy: 140,
                    type: 'coin',
                    radius: 8,
                });
            }
        });
        s.bullets = s.bullets.filter(b => b.isPlayer);

        // Heavy Damage all enemies on screen
        s.enemies.forEach(e => {
            e.hp -= 650;
            spawnExplosion(e.x, e.y, '#ff007f', 20, 4);
        });

        addFloatingText(V_WIDTH / 2, V_HEIGHT / 2, '💥 HYPER BOMB DISCHARGE!', '#00f0ff');
    }, []);

    const handleGameOver = useCallback((isWin = false) => {
        const s = stateRef.current;
        s.gameState = isWin ? 'victory' : 'gameover';
        setGameState(s.gameState);

        if (isWin) {
            StrikerAudio.waveCleared();
            addFloatingText(V_WIDTH / 2, V_HEIGHT / 2 - 40, '👑 GALAXY DEFENDED!', '#fde047');
        } else {
            StrikerAudio.explosion(true);
        }

        const res = recordScore('neonstriker', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;

        s.player = {
            x: V_WIDTH / 2,
            y: V_HEIGHT - 120,
            vx: 0,
            vy: 0,
            width: 38,
            height: 44,
            speed: 390,
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
        s.score = 0;
        s.wave = 1;
        s.lives = 3;
        s.bombs = 2;
        s.hyperMeter = 0;
        s.grazeCount = 0;
        s.multiplier = 1;
        s.multiplierTimer = 0;
        s.waveTimer = 0;
        s.waveEnemiesRemaining = 12;
        s.bossActive = false;
        s.gameState = 'playing';

        setScore(0);
        setWave(1);
        setLives(3);
        setBombs(2);
        setWeaponLevel(1);
        setHasShield(false);
        setHyperMeter(0);
        setGameState('playing');
        setLastRecordResult(null);

        StrikerAudio.powerup();
    }, []);

    // ── MAIN 60 FPS SHMUP ENGINE LOOP ───────────────────────────────────────
    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = (time: number) => {
            const rawDt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const s = stateRef.current;
            const p = s.player;

            // Camera Shake Decay
            if (s.shakeTime > 0) {
                s.shakeTime -= rawDt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Hyper Bomb Visual Ripple
            if (s.hyperBombEffect > 0) {
                s.hyperBombEffect -= rawDt * 1.5;
            }

            // Update Starfield
            s.stars.forEach(st => {
                st.y += st.speed * rawDt;
                if (st.y > V_HEIGHT) {
                    st.y = 0;
                    st.x = Math.random() * V_WIDTH;
                }
            });

            // ── 1. PLAYING STATE SIMULATION ─────────────────────────────────
            if (s.gameState === 'playing') {
                p.orbitAngle += rawDt * 4;

                // Invulnerability Decay
                if (p.invulnerableTime > 0) {
                    p.invulnerableTime -= rawDt;
                }

                // Combo Multiplier Decay
                if (s.multiplierTimer > 0) {
                    s.multiplierTimer -= rawDt;
                    if (s.multiplierTimer <= 0) {
                        s.multiplier = 1;
                    }
                }

                // Player Movement Physics
                const moveSpeed = s.keys.focus ? p.speed * 0.45 : p.speed;
                let targetVx = 0;
                let targetVy = 0;

                if (s.touchPos) {
                    const dx = s.touchPos.x - p.x;
                    const dy = s.touchPos.y - p.y;
                    targetVx = Math.max(-moveSpeed, Math.min(moveSpeed, dx * 12));
                    targetVy = Math.max(-moveSpeed, Math.min(moveSpeed, dy * 12));
                } else {
                    if (s.keys.left) targetVx -= moveSpeed;
                    if (s.keys.right) targetVx += moveSpeed;
                    if (s.keys.up) targetVy -= moveSpeed;
                    if (s.keys.down) targetVy += moveSpeed;
                }

                p.vx += (targetVx - p.vx) * Math.min(1, rawDt * 18);
                p.vy += (targetVy - p.vy) * Math.min(1, rawDt * 18);

                p.x += p.vx * rawDt;
                p.y += p.vy * rawDt;

                // Clamp to screen bounds
                p.x = Math.max(24, Math.min(V_WIDTH - 24, p.x));
                p.y = Math.max(40, Math.min(V_HEIGHT - 40, p.y));

                // Dynamic Roll Tilt
                p.tilt = (p.vx / p.speed) * 0.28;

                // Engine Plasma Exhaust Particles
                if (Math.random() < 0.85) {
                    const flameColor = isMile ? '#ff007f' : '#00f0ff';
                    s.particles.push({
                        x: p.x - 7,
                        y: p.y + 18,
                        vx: (Math.random() - 0.5) * 30,
                        vy: 140 + Math.random() * 80,
                        radius: 2 + Math.random() * 2.5,
                        color: flameColor,
                        life: 0.2,
                        maxLife: 0.2,
                        alpha: 1.0,
                    });
                    s.particles.push({
                        x: p.x + 7,
                        y: p.y + 18,
                        vx: (Math.random() - 0.5) * 30,
                        vy: 140 + Math.random() * 80,
                        radius: 2 + Math.random() * 2.5,
                        color: flameColor,
                        life: 0.2,
                        maxLife: 0.2,
                        alpha: 1.0,
                    });
                }

                // Weapon Auto-Fire System
                p.shootCooldown -= rawDt;
                if ((s.keys.fire || s.touchPos !== null) && p.shootCooldown <= 0) {
                    p.shootCooldown = 0.085;
                    StrikerAudio.laser(p.weaponLevel);

                    const bulletColor = isMile ? '#ff007f' : '#00f0ff';
                    const lvl = p.weaponLevel;

                    if (lvl === 1) {
                        s.bullets.push({
                            x: p.x,
                            y: p.y - 20,
                            vx: 0,
                            vy: -820,
                            radius: 4,
                            color: bulletColor,
                            isPlayer: true,
                            damage: 25,
                        });
                    } else if (lvl === 2) {
                        s.bullets.push(
                            { x: p.x - 10, y: p.y - 18, vx: 0, vy: -820, radius: 4.5, color: bulletColor, isPlayer: true, damage: 25 },
                            { x: p.x + 10, y: p.y - 18, vx: 0, vy: -820, radius: 4.5, color: bulletColor, isPlayer: true, damage: 25 }
                        );
                    } else if (lvl === 3) {
                        s.bullets.push(
                            { x: p.x, y: p.y - 22, vx: 0, vy: -840, radius: 5, color: '#facc15', isPlayer: true, damage: 35 },
                            { x: p.x - 12, y: p.y - 16, vx: -110, vy: -820, radius: 4, color: bulletColor, isPlayer: true, damage: 25 },
                            { x: p.x + 12, y: p.y - 16, vx: 110, vy: -820, radius: 4, color: bulletColor, isPlayer: true, damage: 25 }
                        );
                    } else {
                        // Level 4+ Quintuple Spread + Option Satellite Beams
                        s.bullets.push(
                            { x: p.x, y: p.y - 22, vx: 0, vy: -860, radius: 5, color: '#facc15', isPlayer: true, damage: 40 },
                            { x: p.x - 10, y: p.y - 18, vx: -80, vy: -840, radius: 4.5, color: bulletColor, isPlayer: true, damage: 30 },
                            { x: p.x + 10, y: p.y - 18, vx: 80, vy: -840, radius: 4.5, color: bulletColor, isPlayer: true, damage: 30 },
                            { x: p.x - 20, y: p.y - 14, vx: -180, vy: -800, radius: 4, color: '#ec4899', isPlayer: true, damage: 25 },
                            { x: p.x + 20, y: p.y - 14, vx: 180, vy: -800, radius: 4, color: '#ec4899', isPlayer: true, damage: 25 }
                        );
                    }
                }

                // Homing Missiles (Level 3+)
                p.missileCooldown -= rawDt;
                if (p.weaponLevel >= 3 && p.missileCooldown <= 0) {
                    p.missileCooldown = 0.65;
                    StrikerAudio.missile();

                    [-1, 1].forEach(dir => {
                        s.bullets.push({
                            x: p.x + dir * 18,
                            y: p.y - 8,
                            vx: dir * 160,
                            vy: -240,
                            radius: 4,
                            color: '#fb923c',
                            isPlayer: true,
                            damage: 60,
                            isMissile: true,
                            trail: [],
                        });
                    });
                }

                // ── Wave Spawning Engine ──
                s.waveTimer += rawDt;
                if (s.waveEnemiesRemaining > 0 && s.enemies.length < 7 && s.waveTimer > 1.2) {
                    s.waveTimer = 0;
                    s.waveEnemiesRemaining--;

                    const roll = Math.random();
                    if (roll > 0.65) {
                        // Gunship
                        s.enemies.push({
                            id: crypto.randomUUID(),
                            type: 'gunship',
                            x: 60 + Math.random() * (V_WIDTH - 120),
                            y: -40,
                            vx: (Math.random() - 0.5) * 80,
                            vy: 70 + s.wave * 12,
                            width: 44,
                            height: 38,
                            hp: 90 + s.wave * 35,
                            maxHp: 90 + s.wave * 35,
                            scoreVal: 350,
                            shootTimer: 1.0,
                            shootInterval: 1.6,
                            patternPhase: 0,
                            color: '#fb923c',
                        });
                    } else if (roll > 0.35) {
                        // Interceptor
                        s.enemies.push({
                            id: crypto.randomUUID(),
                            type: 'interceptor',
                            x: 40 + Math.random() * (V_WIDTH - 80),
                            y: -30,
                            vx: (Math.random() - 0.5) * 160,
                            vy: 130 + s.wave * 18,
                            width: 32,
                            height: 32,
                            hp: 40 + s.wave * 15,
                            maxHp: 40 + s.wave * 15,
                            scoreVal: 200,
                            shootTimer: 0.8,
                            shootInterval: 1.2,
                            patternPhase: 0,
                            color: '#a855f7',
                        });
                    } else {
                        // Scout Fast Swarm
                        s.enemies.push({
                            id: crypto.randomUUID(),
                            type: 'scout',
                            x: 30 + Math.random() * (V_WIDTH - 60),
                            y: -25,
                            vx: (Math.random() - 0.5) * 120,
                            vy: 160 + s.wave * 20,
                            width: 26,
                            height: 26,
                            hp: 25 + s.wave * 10,
                            maxHp: 25 + s.wave * 10,
                            scoreVal: 150,
                            shootTimer: 0.6,
                            shootInterval: 1.0,
                            patternPhase: 0,
                            color: '#22c55e',
                        });
                    }
                }

                // Boss Spawn Trigger (Wave % 3 === 0 when wave enemies depleted)
                if (s.waveEnemiesRemaining <= 0 && s.enemies.length === 0 && !s.bossActive) {
                    if (s.wave % 3 === 0) {
                        s.bossActive = true;
                        StrikerAudio.bossAlarm();
                        addShake(14, 0.5);
                        addFloatingText(V_WIDTH / 2, 140, '⚠️ WARNING: DREADNOUGHT NEXUS-9 DETECTED ⚠️', '#ff0055');

                        const bossHp = 2200 + s.wave * 800;
                        s.bossHp = bossHp;
                        s.bossMaxHp = bossHp;

                        s.enemies.push({
                            id: 'boss-nexus',
                            type: 'boss',
                            x: V_WIDTH / 2,
                            y: -90,
                            vx: 90,
                            vy: 40,
                            width: 140,
                            height: 90,
                            hp: bossHp,
                            maxHp: bossHp,
                            scoreVal: 10000,
                            shootTimer: 1.5,
                            shootInterval: 0.45,
                            patternPhase: 0,
                            bossPhase: 1,
                            color: '#ff0055',
                        });
                    } else {
                        // Advance to next wave
                        s.wave++;
                        setWave(s.wave);
                        s.waveEnemiesRemaining = 12 + s.wave * 4;
                        StrikerAudio.waveCleared();
                        addFloatingText(V_WIDTH / 2, V_HEIGHT / 2, `✨ OLEADA ${s.wave} INICIADA!`, '#00f0ff');
                    }
                }

                // ── Update Enemies & Enemy Shooting ──
                for (let i = s.enemies.length - 1; i >= 0; i--) {
                    const e = s.enemies[i];

                    if (e.type === 'boss') {
                        // Boss Movement & Multi-Phase AI
                        if (e.y < 120) {
                            e.y += 35 * rawDt;
                        } else {
                            e.x += e.vx * rawDt;
                            if (e.x < 100) {
                                e.x = 100;
                                e.vx = Math.abs(e.vx);
                            } else if (e.x > V_WIDTH - 100) {
                                e.x = V_WIDTH - 100;
                                e.vx = -Math.abs(e.vx);
                            }
                        }

                        e.shootTimer -= rawDt;
                        e.patternPhase += rawDt * 3;

                        if (e.shootTimer <= 0) {
                            e.shootTimer = e.shootInterval;
                            const hpRatio = e.hp / e.maxHp;

                            if (hpRatio > 0.6) {
                                // Phase 1: Spiral Flower Pattern
                                for (let k = 0; k < 6; k++) {
                                    const ang = e.patternPhase + (k * Math.PI) / 3;
                                    s.bullets.push({
                                        x: e.x,
                                        y: e.y + 30,
                                        vx: Math.cos(ang) * 220,
                                        vy: Math.sin(ang) * 220,
                                        radius: 4.5,
                                        color: '#ff007f',
                                        isPlayer: false,
                                        damage: 1,
                                    });
                                }
                            } else if (hpRatio > 0.3) {
                                // Phase 2: Twin Converging Plasma Beams + Ring Salvos
                                for (let k = -2; k <= 2; k++) {
                                    const ang = Math.PI / 2 + k * 0.18;
                                    s.bullets.push({
                                        x: e.x + k * 18,
                                        y: e.y + 35,
                                        vx: Math.cos(ang) * 290,
                                        vy: Math.sin(ang) * 290,
                                        radius: 5,
                                        color: '#facc15',
                                        isPlayer: false,
                                        damage: 1,
                                    });
                                }
                            } else {
                                // Phase 3: Desperation Bullet Hell
                                for (let k = 0; k < 12; k++) {
                                    const ang = (k * Math.PI * 2) / 12 + Math.sin(e.patternPhase) * 0.5;
                                    s.bullets.push({
                                        x: e.x,
                                        y: e.y + 20,
                                        vx: Math.cos(ang) * 250,
                                        vy: Math.sin(ang) * 250,
                                        radius: 4,
                                        color: '#ec4899',
                                        isPlayer: false,
                                        damage: 1,
                                    });
                                }
                            }
                        }
                    } else {
                        // Standard Enemy AI
                        e.x += e.vx * rawDt;
                        e.y += e.vy * rawDt;

                        if (e.x < 20 || e.x > V_WIDTH - 20) e.vx *= -1;

                        e.shootTimer -= rawDt;
                        if (e.shootTimer <= 0 && e.y > 40 && e.y < V_HEIGHT - 100) {
                            e.shootTimer = e.shootInterval;
                            const dx = p.x - e.x;
                            const dy = p.y - e.y;
                            const dist = Math.hypot(dx, dy) || 1;
                            const spd = 240 + s.wave * 15;

                            s.bullets.push({
                                x: e.x,
                                y: e.y + e.height / 2,
                                vx: (dx / dist) * spd,
                                vy: (dy / dist) * spd,
                                radius: 4,
                                color: '#f43f5e',
                                isPlayer: false,
                                damage: 1,
                            });
                        }
                    }

                    if (e.y > V_HEIGHT + 60) {
                        s.enemies.splice(i, 1);
                    }
                }

                // ── Update Bullets & Graze System ──
                for (let i = s.bullets.length - 1; i >= 0; i--) {
                    const b = s.bullets[i];

                    // Homing Missile Tracking
                    if (b.isMissile) {
                        if (!b.homingTarget || b.homingTarget.hp <= 0 || !s.enemies.includes(b.homingTarget)) {
                            b.homingTarget = s.enemies[0] || null;
                        }

                        if (b.homingTarget) {
                            const dx = b.homingTarget.x - b.x;
                            const dy = b.homingTarget.y - b.y;
                            const dist = Math.hypot(dx, dy) || 1;
                            const targetVx = (dx / dist) * 580;
                            const targetVy = (dy / dist) * 580;
                            b.vx += (targetVx - b.vx) * Math.min(1, rawDt * 10);
                            b.vy += (targetVy - b.vy) * Math.min(1, rawDt * 10);
                        }

                        if (b.trail) {
                            b.trail.unshift({ x: b.x, y: b.y });
                            if (b.trail.length > 6) b.trail.pop();
                        }
                    }

                    b.x += b.vx * rawDt;
                    b.y += b.vy * rawDt;

                    // Bullet Offscreen
                    if (b.x < -20 || b.x > V_WIDTH + 20 || b.y < -20 || b.y > V_HEIGHT + 20) {
                        s.bullets.splice(i, 1);
                        continue;
                    }

                    // ── Player Bullet Hits Enemy ──
                    if (b.isPlayer) {
                        for (let j = s.enemies.length - 1; j >= 0; j--) {
                            const e = s.enemies[j];
                            if (
                                Math.abs(b.x - e.x) < e.width / 2 + b.radius &&
                                Math.abs(b.y - e.y) < e.height / 2 + b.radius
                            ) {
                                e.hp -= b.damage;
                                spawnExplosion(b.x, b.y, b.color, 4, 1.8);
                                StrikerAudio.enemyHit();

                                if (e.hp <= 0) {
                                    StrikerAudio.explosion(e.type === 'boss');
                                    spawnExplosion(e.x, e.y, e.color, e.type === 'boss' ? 70 : 28, 4);
                                    addShake(e.type === 'boss' ? 16 : 5, 0.35);

                                    s.score += e.scoreVal * s.multiplier;
                                    setScore(s.score);
                                    s.multiplier = Math.min(8, s.multiplier + 1);
                                    s.multiplierTimer = 3.0;

                                    // Drop power-ups
                                    const roll = Math.random();
                                    if (roll < 0.28 || e.type === 'boss') {
                                        const kinds: ('weapon' | 'shield' | 'bomb' | 'missile' | 'coin')[] = [
                                            'weapon',
                                            'shield',
                                            'bomb',
                                            'missile',
                                            'coin',
                                        ];
                                        s.powerups.push({
                                            x: e.x,
                                            y: e.y,
                                            vy: 110,
                                            type: kinds[Math.floor(Math.random() * kinds.length)],
                                            radius: 12,
                                        });
                                    }

                                    if (e.type === 'boss') {
                                        s.bossActive = false;
                                        addFloatingText(e.x, e.y, '+10,000 DREADNOUGHT DESTROYED!', '#facc15');
                                        handleGameOver(true);
                                    } else {
                                        addFloatingText(e.x, e.y, `+${e.scoreVal}`, '#00f0ff');
                                    }

                                    s.enemies.splice(j, 1);
                                }

                                s.bullets.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        // ── Enemy Bullet vs Player (Hit & Graze System) ──
                        const dx = b.x - p.x;
                        const dy = b.y - p.y;
                        const dist = Math.hypot(dx, dy);

                        // 1. Graze check (Within 18px of ship)
                        if (!b.grazed && dist < b.radius + 18 && dist >= b.radius + 6) {
                            b.grazed = true;
                            s.grazeCount++;
                            s.score += 25;
                            s.hyperMeter = Math.min(100, s.hyperMeter + 3.5);
                            setHyperMeter(Math.round(s.hyperMeter));
                            setScore(s.score);
                            StrikerAudio.graze();

                            // Sparkle particles at graze point
                            spawnExplosion(b.x, b.y, '#fde047', 5, 1.5);
                        }

                        // 2. Direct Hit Check (Within 6px core hitbox)
                        if (dist < b.radius + 6 && p.invulnerableTime <= 0) {
                            if (p.hasShield) {
                                p.hasShield = false;
                                setHasShield(false);
                                p.invulnerableTime = 1.2;
                                StrikerAudio.shieldHit();
                                addShake(10, 0.3);
                                spawnExplosion(p.x, p.y, '#38bdf8', 30, 3.5);
                                addFloatingText(p.x, p.y, 'SHIELD BROKEN!', '#38bdf8');
                            } else {
                                s.lives--;
                                setLives(s.lives);
                                p.invulnerableTime = 2.4;
                                p.weaponLevel = Math.max(1, p.weaponLevel - 1);
                                setWeaponLevel(p.weaponLevel);
                                StrikerAudio.explosion(false);
                                addShake(18, 0.5);
                                spawnExplosion(p.x, p.y, '#ff0055', 45, 4);

                                if (s.lives <= 0) {
                                    handleGameOver(false);
                                }
                            }
                            s.bullets.splice(i, 1);
                        }
                    }
                }

                // ── Update Power-Ups ──
                for (let i = s.powerups.length - 1; i >= 0; i--) {
                    const pu = s.powerups[i];
                    pu.y += pu.vy * rawDt;

                    const dx = pu.x - p.x;
                    const dy = pu.y - p.y;
                    if (Math.hypot(dx, dy) < pu.radius + 20) {
                        StrikerAudio.powerup();
                        spawnExplosion(pu.x, pu.y, '#facc15', 16, 2.5);

                        if (pu.type === 'weapon') {
                            p.weaponLevel = Math.min(5, p.weaponLevel + 1);
                            setWeaponLevel(p.weaponLevel);
                            addFloatingText(pu.x, pu.y, 'WEAPON UPGRADE! ⚡', '#facc15');
                        } else if (pu.type === 'shield') {
                            p.hasShield = true;
                            setHasShield(true);
                            addFloatingText(pu.x, pu.y, 'ENERGY SHIELD! 🛡️', '#38bdf8');
                        } else if (pu.type === 'bomb') {
                            s.bombs = Math.min(5, s.bombs + 1);
                            setBombs(s.bombs);
                            addFloatingText(pu.x, pu.y, '+1 HYPER BOMB! 💣', '#ff007f');
                        } else if (pu.type === 'missile') {
                            s.score += 500;
                            s.hyperMeter = Math.min(100, s.hyperMeter + 25);
                            setHyperMeter(Math.round(s.hyperMeter));
                            addFloatingText(pu.x, pu.y, 'HOMING MISSILES! 🚀', '#fb923c');
                        } else if (pu.type === 'coin') {
                            s.score += 150;
                            s.hyperMeter = Math.min(100, s.hyperMeter + 5);
                            setHyperMeter(Math.round(s.hyperMeter));
                            addFloatingText(pu.x, pu.y, '+150 🪙', '#fde047');
                        }

                        setScore(s.score);
                        s.powerups.splice(i, 1);
                        continue;
                    }

                    if (pu.y > V_HEIGHT + 20) {
                        s.powerups.splice(i, 1);
                    }
                }
            }

            // Update Particles
            s.particles.forEach(pt => {
                pt.x += pt.vx * rawDt;
                pt.y += pt.vy * rawDt;
                pt.life -= rawDt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            // Update Floating Texts
            s.floatingTexts.forEach(ft => {
                ft.y -= 34 * rawDt;
                ft.life -= rawDt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // ── 2. RENDER SCENE ──────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            // Camera Screen Shake
            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Deep Space Arcade Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#04020a');
            bgGrad.addColorStop(0.5, '#0c051f');
            bgGrad.addColorStop(1, '#05020c');
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

            // Hyper Bomb Ripple Ring
            if (s.hyperBombEffect > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(0, 240, 255, ${s.hyperBombEffect})`;
                ctx.lineWidth = 16 * s.hyperBombEffect;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, (1.0 - s.hyperBombEffect) * V_HEIGHT * 0.9, 0, Math.PI * 2);
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
                        : '#fde047';

                ctx.shadowColor = col;
                ctx.shadowBlur = 14;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = col;
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const label =
                    pu.type === 'weapon'
                        ? '⚡'
                        : pu.type === 'shield'
                        ? '🛡️'
                        : pu.type === 'bomb'
                        ? '💣'
                        : pu.type === 'missile'
                        ? '🚀'
                        : '🪙';
                ctx.fillText(label, 0, 0);
                ctx.restore();
            });

            // Render Bullets
            s.bullets.forEach(b => {
                ctx.save();
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 10;

                // Missile Trail
                if (b.isMissile && b.trail) {
                    b.trail.forEach((t, idx) => {
                        ctx.fillStyle = `rgba(251, 146, 60, ${0.4 * (1 - idx / b.trail!.length)})`;
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, 3 * (1 - idx / b.trail!.length), 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Render Enemies
            s.enemies.forEach(e => {
                ctx.save();
                ctx.translate(e.x, e.y);

                if (e.type === 'boss') {
                    // Dreadnought Nexus-9 Boss Hull
                    ctx.shadowColor = '#ff0055';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = '#1e102d';
                    ctx.strokeStyle = '#ff0055';
                    ctx.lineWidth = 3;

                    ctx.beginPath();
                    ctx.moveTo(0, 50);
                    ctx.lineTo(70, 15);
                    ctx.lineTo(60, -45);
                    ctx.lineTo(0, -25);
                    ctx.lineTo(-60, -45);
                    ctx.lineTo(-70, 15);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Glowing Core
                    ctx.fillStyle = Math.sin(time * 0.01) > 0 ? '#ff007f' : '#facc15';
                    ctx.beginPath();
                    ctx.arc(0, 8, 18, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Standard Enemy Ship
                    ctx.shadowColor = e.color;
                    ctx.shadowBlur = 12;
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

                // Health Bar
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

            // Render Player Starfighter Mech
            if (s.gameState === 'playing') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.tilt);

                const isBlinking = p.invulnerableTime > 0 && Math.floor(time / 80) % 2 === 0;

                if (!isBlinking) {
                    // Starfighter Vector Hull
                    ctx.shadowColor = pilotColor;
                    ctx.shadowBlur = 16;
                    ctx.fillStyle = '#080d24';
                    ctx.strokeStyle = pilotColor;
                    ctx.lineWidth = 2.4;

                    ctx.beginPath();
                    ctx.moveTo(0, -24);
                    ctx.lineTo(20, 16);
                    ctx.lineTo(9, 12);
                    ctx.lineTo(0, 18);
                    ctx.lineTo(-9, 12);
                    ctx.lineTo(-20, 16);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Cockpit Canopy
                    ctx.fillStyle = secondaryColor;
                    ctx.beginPath();
                    ctx.moveTo(0, -14);
                    ctx.lineTo(5, 2);
                    ctx.lineTo(-5, 2);
                    ctx.closePath();
                    ctx.fill();

                    // Hitbox Core Reticle (When focusing or grazing)
                    if (s.keys.focus || s.grazeCount > 0) {
                        ctx.strokeStyle = '#fde047';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, 6, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // Energy Shield Bubble
                    if (p.hasShield) {
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2.5;
                        ctx.shadowColor = '#00f0ff';
                        ctx.shadowBlur = 18;
                        ctx.beginPath();
                        ctx.arc(0, 0, 28 + Math.sin(time * 0.008) * 2, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // Orbiting Satellite Bit Drones (Level 4+)
                    if (p.weaponLevel >= 4) {
                        const bit1X = Math.cos(p.orbitAngle) * 36;
                        const bit1Y = Math.sin(p.orbitAngle) * 36;
                        const bit2X = Math.cos(p.orbitAngle + Math.PI) * 36;
                        const bit2Y = Math.sin(p.orbitAngle + Math.PI) * 36;

                        ctx.fillStyle = pilotColor;
                        ctx.shadowColor = pilotColor;
                        ctx.shadowBlur = 12;
                        ctx.beginPath();
                        ctx.arc(bit1X, bit1Y, 5, 0, Math.PI * 2);
                        ctx.arc(bit2X, bit2Y, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            // Render Particles & Texts
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

            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Scanlines Filter
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
                for (let y = 0; y < V_HEIGHT; y += 4) {
                    ctx.fillRect(0, y, V_WIDTH, 1.5);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled, isMile, pilotColor, secondaryColor, handleGameOver]);

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

    // Touch & Pointer Drag Steer
    const handlePointerDown = (e: React.PointerEvent) => {
        if (stateRef.current.gameState !== 'playing' || !containerRef.current) return;
        updateTouchPos(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (stateRef.current.gameState !== 'playing' || !containerRef.current) return;
        if (e.buttons > 0) updateTouchPos(e);
    };

    const handlePointerUp = () => {
        stateRef.current.touchPos = null;
    };

    const updateTouchPos = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = V_WIDTH / rect.width;
        const scaleY = V_HEIGHT / rect.height;
        stateRef.current.touchPos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY - 30,
        };
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-[75vh] max-h-[840px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Cockpit HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    {/* Score */}
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)] backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">PUNTUACIÓN</div>
                        <div className="text-sm sm:text-base font-black text-white tabular-nums">{score}</div>
                    </div>

                    {/* Ship Callsign Badge */}
                    <div className="bg-black/85 border border-pink-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.3)] backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">{pilotName}</div>
                        <div className="text-xs font-black text-white">{shipName}</div>
                    </div>

                    {/* Wave */}
                    <div className="bg-black/85 border border-amber-500/50 px-2.5 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">OLEADA</div>
                        <div className="text-sm font-black text-yellow-300">{wave}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Hyper Bomb Button */}
                    <button
                        onClick={triggerHyperBomb}
                        className={`px-3 py-1.5 border rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-1 ${
                            bombs > 0 || hyperMeter >= 100
                                ? 'border-pink-500 text-pink-300 bg-pink-950/70 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse'
                                : 'border-white/20 text-white/40 bg-black/80'
                        }`}
                        title="Descarga Hyper Bomb"
                    >
                        <Bomb className="w-3.5 h-3.5" />
                        <span>BOMBA ({bombs})</span>
                    </button>

                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-xl transition-all shadow-lg ${crtEnabled ? 'border-cyan-400 text-cyan-400 bg-cyan-950/70' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Hyper Meter Bar in HUD */}
            <div className="absolute top-16 left-4 right-4 z-20 pointer-events-none">
                <div className="flex items-center justify-between text-[9px] text-cyan-300 font-bold mb-1">
                    <span>⚡ HYPER GAUGE (GRAZE BONUS)</span>
                    <span>{hyperMeter}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/80 border border-cyan-500/40 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-150 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                        style={{ width: `${hyperMeter}%` }}
                    />
                </div>
            </div>

            {/* Start / Game Over / Victory Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-pink-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                        <div className="text-pink-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
                            SANTI & MILE • NEON STRIKER 🚀
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'victory'
                                ? '👑 ¡VICTORIA CÓSMICA!'
                                : gameState === 'gameover'
                                ? '💀 NAVE DESTRUIDA'
                                : 'NEON STRIKER ⚡'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'victory'
                                ? `¡Has aniquilado al Acorazado Dreadnought Nexus-9 en la oleada ${wave}! Puntuación final: ${score}`
                                : gameState === 'gameover'
                                ? `Tu nave ha caído en la oleada ${wave}. Puntuación obtenida: ${score}`
                                : 'Pilota tu caza mecha, esquiva las balas enemigas para rozarlas (Graze), carga la barra Hyper y detona bombas para limpiar el cosmos.'}
                        </p>

                        {gameState !== 'menu' && lastRecordResult && (
                            <div className="mb-6 p-3 bg-pink-950/50 border border-pink-500/40 rounded-xl text-xs text-pink-300">
                                {lastRecordResult.isNewPersonalBest && <div className="font-bold text-yellow-400 mb-1">🏆 ¡NUEVO RÉCORD PERSONAL!</div>}
                                <div>Monedas de Sinergia Ganadas: <span className="font-bold text-yellow-400">+{lastRecordResult.coinsEarned} 🪙</span></div>
                            </div>
                        )}

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-[#ff4b89] via-fuchsia-500 to-cyan-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,75,137,0.7)]"
                        >
                            {gameState !== 'menu' ? 'VOLVER A DESPEGAR 🚀' : 'INICIAR MISIÓN 🕹️'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
