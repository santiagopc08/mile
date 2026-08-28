'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrickAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Sparkles, ChevronLeft, ChevronRight, Heart, ArrowRight } from 'lucide-react';
import { useArcadePhotos, StylizedMemory } from '@/hooks/useArcadePhotos';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';
import { BrutalistCorners } from '@/components/ui/BrutalistPanel';

interface BrickStormProps {
    accentColor?: string;
}

// Coordinate space resolution
const V_WIDTH = 1280;
const V_HEIGHT = 720;

const BASE_PADDLE_WIDTH = 140;
const PADDLE_HEIGHT = 18;
const PADDLE_Y = 660;
const BALL_RADIUS = 8;
const BASE_BALL_SPEED = 540;

const BRICK_COLS = 12;
const BRICK_WIDTH = 88;
const BRICK_HEIGHT = 28;
const BRICK_GAP = 6;
const BRICK_TOP = 80;

type DropKind = 'wide' | 'multi' | 'slow' | 'life' | 'laser';

interface Brick {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    hits: number;
    maxHits: number;
    golden: boolean;
    color: string;
    fractures: { x1: number; y1: number; x2: number; y2: number }[];
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    stuckToPaddle: boolean;
    trail: { x: number; y: number }[];
}

interface Drop {
    id: number;
    x: number;
    y: number;
    vy: number;
    kind: DropKind;
}

interface Laser {
    x: number;
    y: number;
    vy: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
    angle?: number;
    spin?: number;
    isShard?: boolean;
}

export function BrickStormCanvas({ accentColor = '#00e5ff' }: BrickStormProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();
    const { stylizedMemories, accentColor: profileAccent } = useArcadePhotos(780, 420);

    const elBest = scores['brickstorm']?.el || 0;
    const ellaBest = scores['brickstorm']?.ella || 0;

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(0);
    const [revealPercent, setRevealPercent] = useState(0);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'cleared'>('menu');
    const [clearedMemory, setClearedMemory] = useState<StylizedMemory | null>(null);
    const [mutedState, setMutedState] = useState(false);
    const [activePowerups, setActivePowerups] = useState<string[]>([]);
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    // Mutable game state held in refs for 60fps loop
    const stateRef = useRef({
        paddleX: V_WIDTH / 2,
        paddleTargetX: V_WIDTH / 2,
        paddleWidth: BASE_PADDLE_WIDTH,
        balls: [] as Ball[],
        bricks: [] as Brick[],
        totalLevelBricks: 1,
        drops: [] as Drop[],
        lasers: [] as Laser[],
        particles: [] as Particle[],
        currentMemory: null as StylizedMemory | null,
        score: 0,
        highScore: 0,
        lives: 3,
        level: 1,
        combo: 0,
        comboTimer: 0,
        wideTimer: 0,
        slowTimer: 0,
        laserTimer: 0,
        lastLaserFire: 0,
        shake: 0,
        shakeOffset: { x: 0, y: 0 },
        keys: { left: false, right: false, fire: false },
        touchX: null as number | null,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover' | 'cleared',
        nextDropId: 1,
    });

    // Load High Score
    useEffect(() => {
        setMutedState(loadMutedPreference());
        const activePb = profile === 'ella' ? ellaBest : elBest;
        setHighScore(activePb);
        stateRef.current.highScore = activePb;
    }, [profile, elBest, ellaBest]);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const buildLevel = useCallback((lvl: number) => {
        const rows = Math.min(7, 4 + Math.floor((lvl - 1) / 2));
        const boardWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
        const startX = (V_WIDTH - boardWidth) / 2 + BRICK_WIDTH / 2;

        const colors = [
            '#00f0ff', // Electric Topaz
            '#f43f5e', // Ruby Rose
            '#fbbf24', // Radiant Amber
            '#10b981', // Emerald Mint
            '#a855f7', // Amethyst Purple
            '#ec4899', // Bubblegum Pink
        ];

        const bricks: Brick[] = [];
        let id = 1;

        for (let r = 0; r < rows; r++) {
            const rowColor = colors[r % colors.length];
            for (let c = 0; c < BRICK_COLS; c++) {
                if (Math.random() < 0.05 + r * 0.01) continue;

                const isGolden = Math.random() < 0.08;
                const hits = isGolden ? 2 : 1 + Math.min(2, Math.floor((rows - 1 - r) / 2) + Math.floor((lvl - 1) / 3));

                // Generate procedural crack lines
                const fractures = [
                    { x1: -BRICK_WIDTH * 0.3, y1: -BRICK_HEIGHT * 0.3, x2: 0, y2: 0 },
                    { x2: BRICK_WIDTH * 0.35, y2: BRICK_HEIGHT * 0.25, x1: 0, y1: 0 },
                ];

                bricks.push({
                    id: id++,
                    x: startX + c * (BRICK_WIDTH + BRICK_GAP),
                    y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
                    w: BRICK_WIDTH,
                    h: BRICK_HEIGHT,
                    hits,
                    maxHits: hits,
                    golden: isGolden,
                    color: isGolden ? '#fbbf24' : rowColor,
                    fractures,
                });
            }
        }

        stateRef.current.bricks = bricks;
        stateRef.current.totalLevelBricks = Math.max(1, bricks.length);
        stateRef.current.drops = [];
        stateRef.current.lasers = [];
        stateRef.current.balls = [
            {
                x: stateRef.current.paddleX,
                y: PADDLE_Y - BALL_RADIUS - 2,
                vx: (Math.random() - 0.5) * 200,
                vy: -BASE_BALL_SPEED,
                speed: BASE_BALL_SPEED,
                stuckToPaddle: true,
                trail: [],
            },
        ];

        if (stylizedMemories.length > 0) {
            stateRef.current.currentMemory = stylizedMemories[(lvl - 1) % stylizedMemories.length];
        }
        setRevealPercent(0);
    }, [stylizedMemories]);

    // Keep current memory synced
    useEffect(() => {
        if (stylizedMemories.length > 0 && !stateRef.current.currentMemory) {
            stateRef.current.currentMemory = stylizedMemories[(level - 1) % stylizedMemories.length];
        }
    }, [stylizedMemories, level]);

    const spawnParticles = (x: number, y: number, color: string, count = 14, speed = 200, isShard = true) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.35 + Math.random() * 0.85);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color,
                life: 0,
                maxLife: 0.4 + Math.random() * 0.45,
                size: isShard ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 14,
                isShard,
            });
        }
    };

    const addShake = (amt: number) => {
        stateRef.current.shake = Math.min(16, stateRef.current.shake + amt);
    };

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.score = 0;
        s.lives = 3;
        s.level = 1;
        s.combo = 0;
        s.comboTimer = 0;
        s.wideTimer = 0;
        s.slowTimer = 0;
        s.laserTimer = 0;
        s.paddleWidth = BASE_PADDLE_WIDTH;
        s.paddleX = V_WIDTH / 2;
        s.paddleTargetX = V_WIDTH / 2;
        s.particles = [];
        s.gameState = 'playing';

        setScore(0);
        setLives(3);
        setLevel(1);
        setCombo(0);
        setGameState('playing');
        setActivePowerups([]);

        buildLevel(1);
        BrickAudio.paddleHit();
    }, [buildLevel]);

    const handleNextLevel = useCallback(() => {
        const nextLvl = level + 1;
        setLevel(nextLvl);
        stateRef.current.level = nextLvl;
        stateRef.current.gameState = 'playing';
        setGameState('playing');
        setClearedMemory(null);
        buildLevel(nextLvl);
        BrickAudio.paddleHit();
    }, [level, buildLevel]);

    const launchBall = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing') return;

        let launched = false;
        s.balls.forEach((b) => {
            if (b.stuckToPaddle) {
                b.stuckToPaddle = false;
                const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
                b.vx = b.speed * Math.sin(angle);
                b.vy = -b.speed * Math.cos(angle);
                launched = true;
            }
        });

        if (launched) BrickAudio.paddleHit();
    }, []);

    const fireLaser = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing' || s.laserTimer <= 0) return;

        const now = performance.now();
        if (now - s.lastLaserFire < 220) return;
        s.lastLaserFire = now;

        const leftX = s.paddleX - s.paddleWidth / 2 + 10;
        const rightX = s.paddleX + s.paddleWidth / 2 - 10;
        const y = PADDLE_Y - 14;

        s.lasers.push({ x: leftX, y, vy: -750 }, { x: rightX, y, vy: -750 });
        BrickAudio.laserFire();
        addShake(1.5);
    }, []);

    // ── MAIN 60 FPS CRYSTAL PRISM LOOP ──────────────────────────────────────
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

            // Screen Shake decay
            if (s.shake > 0) {
                s.shakeOffset.x = (Math.random() * 2 - 1) * s.shake;
                s.shakeOffset.y = (Math.random() * 2 - 1) * s.shake;
                s.shake = Math.max(0, s.shake - dt * 25);
            } else {
                s.shakeOffset.x = 0;
                s.shakeOffset.y = 0;
            }

            if (s.gameState === 'playing') {
                // Combo timer decay
                if (s.comboTimer > 0) {
                    s.comboTimer -= dt;
                    if (s.comboTimer <= 0) {
                        s.combo = 0;
                        setCombo(0);
                    }
                }

                // Powerup Timers
                const currentPowerups: string[] = [];
                if (s.wideTimer > 0) {
                    s.wideTimer -= dt;
                    s.paddleWidth = BASE_PADDLE_WIDTH * 1.45;
                    currentPowerups.push(`WIDE ${Math.ceil(s.wideTimer)}s`);
                } else {
                    s.paddleWidth = BASE_PADDLE_WIDTH;
                }

                if (s.slowTimer > 0) {
                    s.slowTimer -= dt;
                    currentPowerups.push(`SLOW ${Math.ceil(s.slowTimer)}s`);
                }

                if (s.laserTimer > 0) {
                    s.laserTimer -= dt;
                    currentPowerups.push(`LASER ${Math.ceil(s.laserTimer)}s`);
                }

                setActivePowerups(currentPowerups);

                // Paddle Steering Physics
                const maxPaddleSpeed = 950;
                if (s.touchX !== null) {
                    s.paddleTargetX = Math.max(s.paddleWidth / 2 + 16, Math.min(V_WIDTH - s.paddleWidth / 2 - 16, s.touchX));
                    s.paddleX += (s.paddleTargetX - s.paddleX) * Math.min(1, dt * 18);
                } else {
                    let move = 0;
                    if (s.keys.left) move -= 1;
                    if (s.keys.right) move += 1;

                    if (move !== 0) {
                        s.paddleX += move * maxPaddleSpeed * dt;
                    }
                    s.paddleX = Math.max(s.paddleWidth / 2 + 16, Math.min(V_WIDTH - s.paddleWidth / 2 - 16, s.paddleX));
                }

                // Update Drops
                for (let i = s.drops.length - 1; i >= 0; i--) {
                    const drop = s.drops[i];
                    drop.y += drop.vy * dt;

                    // Paddle Catch
                    if (
                        drop.y >= PADDLE_Y - PADDLE_HEIGHT / 2 - 12 &&
                        drop.y <= PADDLE_Y + PADDLE_HEIGHT / 2 + 12 &&
                        Math.abs(drop.x - s.paddleX) <= s.paddleWidth / 2 + 14
                    ) {
                        if (drop.kind === 'wide') {
                            s.wideTimer = 10;
                            s.score += 200;
                        } else if (drop.kind === 'slow') {
                            s.slowTimer = 8;
                            s.balls.forEach((b) => (b.speed = BASE_BALL_SPEED * 0.7));
                            s.score += 200;
                        } else if (drop.kind === 'laser') {
                            s.laserTimer = 10;
                            s.score += 300;
                        } else if (drop.kind === 'life') {
                            s.lives = Math.min(5, s.lives + 1);
                            setLives(s.lives);
                            s.score += 500;
                        } else if (drop.kind === 'multi') {
                            const newBalls: Ball[] = [];
                            s.balls.forEach((b) => {
                                for (let a = -1; a <= 1; a += 2) {
                                    const ang = a * 0.45;
                                    const cos = Math.cos(ang);
                                    const sin = Math.sin(ang);
                                    newBalls.push({
                                        x: b.x,
                                        y: b.y,
                                        vx: b.vx * cos - b.vy * sin,
                                        vy: b.vx * sin + b.vy * cos,
                                        speed: b.speed,
                                        stuckToPaddle: false,
                                        trail: [],
                                    });
                                }
                            });
                            s.balls.push(...newBalls);
                            s.score += 200;
                        }

                        BrickAudio.powerupCollect();
                        spawnParticles(drop.x, drop.y, '#facc15', 18, 160);
                        setScore(s.score);
                        s.drops.splice(i, 1);
                        continue;
                    }

                    if (drop.y > V_HEIGHT + 20) {
                        s.drops.splice(i, 1);
                    }
                }

                // Update Lasers
                for (let i = s.lasers.length - 1; i >= 0; i--) {
                    const l = s.lasers[i];
                    l.y += l.vy * dt;

                    for (let j = s.bricks.length - 1; j >= 0; j--) {
                        const b = s.bricks[j];
                        if (Math.abs(l.x - b.x) <= b.w / 2 && Math.abs(l.y - b.y) <= b.h / 2) {
                            b.hits -= 1;
                            s.score += 50;
                            spawnParticles(l.x, l.y, '#00f0ff', 6, 120);

                            if (b.hits <= 0) {
                                spawnParticles(b.x, b.y, b.color, 16, 220, true);
                                BrickAudio.brickDestroy(s.combo);
                                s.bricks.splice(j, 1);
                            } else {
                                BrickAudio.brickHit(s.combo);
                            }

                            s.lasers.splice(i, 1);
                            break;
                        }
                    }

                    if (l.y < 0) s.lasers.splice(i, 1);
                }

                // Update Balls & Trail
                for (let i = s.balls.length - 1; i >= 0; i--) {
                    const b = s.balls[i];

                    if (b.stuckToPaddle) {
                        b.x = s.paddleX;
                        b.y = PADDLE_Y - BALL_RADIUS - 2;
                        continue;
                    }

                    // Update Ball Trail
                    b.trail.unshift({ x: b.x, y: b.y });
                    if (b.trail.length > 7) b.trail.pop();

                    b.x += b.vx * dt;
                    b.y += b.vy * dt;

                    // Wall Collisions
                    if (b.x <= 24) {
                        b.x = 24;
                        b.vx = Math.abs(b.vx);
                        BrickAudio.wallBounce();
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
                    } else if (b.x >= V_WIDTH - 24) {
                        b.x = V_WIDTH - 24;
                        b.vx = -Math.abs(b.vx);
                        BrickAudio.wallBounce();
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
                    }

                    if (b.y <= 16) {
                        b.y = 16;
                        b.vy = Math.abs(b.vy);
                        BrickAudio.wallBounce();
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
                    }

                    // Paddle Bounce
                    if (
                        b.y >= PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS &&
                        b.y <= PADDLE_Y + PADDLE_HEIGHT / 2 &&
                        b.vy > 0
                    ) {
                        const hitOffset = (b.x - s.paddleX) / (s.paddleWidth / 2);
                        if (Math.abs(hitOffset) <= 1.1) {
                            b.y = PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
                            const maxAngle = (72 * Math.PI) / 180;
                            const bounceAngle = hitOffset * maxAngle;
                            const spd = b.speed;
                            b.vx = spd * Math.sin(bounceAngle);
                            b.vy = -spd * Math.cos(bounceAngle);

                            BrickAudio.paddleHit();
                            spawnParticles(b.x, b.y, '#00f0ff', 10, 140);
                            addShake(2.5);
                        }
                    }

                    // Brick Collisions
                    for (let j = s.bricks.length - 1; j >= 0; j--) {
                        const brick = s.bricks[j];
                        const bx = brick.x;
                        const by = brick.y;
                        const bw = brick.w;
                        const bh = brick.h;

                        const closestX = Math.max(bx - bw / 2, Math.min(b.x, bx + bw / 2));
                        const closestY = Math.max(by - bh / 2, Math.min(b.y, by + bh / 2));
                        const dx = b.x - closestX;
                        const dy = b.y - closestY;
                        const distSq = dx * dx + dy * dy;

                        if (distSq <= BALL_RADIUS * BALL_RADIUS) {
                            const overlapX = bw / 2 - Math.abs(b.x - bx) + BALL_RADIUS;
                            const overlapY = bh / 2 - Math.abs(b.y - by) + BALL_RADIUS;

                            if (overlapX < overlapY) {
                                b.vx = (b.x > bx ? 1 : -1) * Math.abs(b.vx);
                            } else {
                                b.vy = (b.y > by ? 1 : -1) * Math.abs(b.vy);
                            }

                            brick.hits -= 1;
                            s.combo += 1;
                            s.comboTimer = 2.0;
                            setCombo(s.combo);

                            const pts = (brick.golden ? 300 : 100) * s.combo * s.level;
                            s.score += pts;
                            setScore(s.score);

                            if (s.score > s.highScore) {
                                s.highScore = s.score;
                                setHighScore(s.score);
                                localStorage.setItem('brickstorm_highscore', s.score.toString());
                            }

                            if (brick.hits <= 0) {
                                spawnParticles(bx, by, brick.color, brick.golden ? 24 : 16, 220, true);
                                BrickAudio.brickDestroy(s.combo);
                                addShake(brick.golden ? 6 : 3.5);

                                // Drop chance
                                if (Math.random() < 0.15) {
                                    const kinds: DropKind[] = ['wide', 'multi', 'slow', 'life', 'laser'];
                                    s.drops.push({
                                        id: s.nextDropId++,
                                        x: bx,
                                        y: by,
                                        vy: 180,
                                        kind: kinds[Math.floor(Math.random() * kinds.length)],
                                    });
                                    BrickAudio.powerupSpawn();
                                }

                                s.bricks.splice(j, 1);

                                const clearedCount = s.totalLevelBricks - s.bricks.length;
                                const pct = Math.round((clearedCount / s.totalLevelBricks) * 100);
                                setRevealPercent(pct);
                            } else {
                                spawnParticles(b.x, b.y, brick.color, 8, 120);
                                if (brick.golden) BrickAudio.goldenHit();
                                else BrickAudio.brickHit(s.combo);
                                addShake(2);
                            }
                            break;
                        }
                    }

                    if (b.y > V_HEIGHT + 30) {
                        s.balls.splice(i, 1);
                    }
                }

                // Check If All Balls Lost
                if (s.balls.length === 0) {
                    s.lives -= 1;
                    setLives(s.lives);
                    BrickAudio.ballLost();
                    addShake(8);

                    if (s.lives <= 0) {
                        s.gameState = 'gameover';
                        setGameState('gameover');
                        BrickAudio.gameOver();
                        const res = recordScore('brickstorm', s.score);
                        setLastRecordResult(res);
                    } else {
                        s.balls = [
                            {
                                x: s.paddleX,
                                y: PADDLE_Y - BALL_RADIUS - 2,
                                vx: 0,
                                vy: -BASE_BALL_SPEED,
                                speed: BASE_BALL_SPEED,
                                stuckToPaddle: true,
                                trail: [],
                            },
                        ];
                    }
                }

                // Check If Level Cleared (Memory Unlocked)
                if (s.bricks.length === 0) {
                    s.gameState = 'cleared';
                    setGameState('cleared');
                    s.score += 2500;
                    setScore(s.score);
                    setRevealPercent(100);
                    if (s.currentMemory) {
                        setClearedMemory(s.currentMemory);
                    }
                    BrickAudio.levelCleared();
                    const res = recordScore('brickstorm', s.score);
                    setLastRecordResult(res);
                }
            }

            // Update Particles
            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.life += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 120 * dt; // Gravity on crystal shards
                if (p.spin && p.angle !== undefined) p.angle += p.spin * dt;
                p.vx *= 0.97;
                p.vy *= 0.97;
                if (p.life >= p.maxLife) {
                    s.particles.splice(i, 1);
                }
            }

            // ── RENDER SCENE ────────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            // Apply Screen Shake
            ctx.translate(s.shakeOffset.x, s.shakeOffset.y);

            // 1. Cyber Dark Background
            ctx.fillStyle = '#06060c';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // 2. Render Stylized Memory Photo Behind Bricks (Scratch & Reveal)
            const boardWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
            const boardStartX = (V_WIDTH - boardWidth) / 2;
            const boardHeight = 7 * (BRICK_HEIGHT + BRICK_GAP);

            if (s.currentMemory && s.currentMemory.holoCanvas) {
                ctx.save();
                ctx.shadowColor = profileAccent;
                ctx.shadowBlur = 18;
                ctx.strokeStyle = profileAccent + '50';
                ctx.lineWidth = 3;
                ctx.strokeRect(boardStartX - 4, BRICK_TOP - 4, boardWidth + 8, boardHeight + 8);
                ctx.shadowBlur = 0;

                ctx.globalAlpha = 0.9;
                ctx.drawImage(
                    s.currentMemory.holoCanvas,
                    boardStartX,
                    BRICK_TOP,
                    boardWidth,
                    boardHeight
                );
                ctx.restore();
            }

            // 3. Playfield Neon Boundaries
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(16, 0);
            ctx.lineTo(16, V_HEIGHT);
            ctx.moveTo(V_WIDTH - 16, 0);
            ctx.lineTo(V_WIDTH - 16, V_HEIGHT);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 4. Render Faceted Crystal Prism Bricks
            s.bricks.forEach((b) => {
                ctx.save();
                const bx = b.x - b.w / 2;
                const by = b.y - b.h / 2;

                // Crystal Body Gradient
                const crystalGrad = ctx.createLinearGradient(bx, by, bx, by + b.h);
                crystalGrad.addColorStop(0, '#ffffff');
                crystalGrad.addColorStop(0.2, b.color);
                crystalGrad.addColorStop(1, b.golden ? '#b45309' : '#0f172a');

                ctx.fillStyle = crystalGrad;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = b.golden ? 18 : 10;
                ctx.beginPath();
                ctx.roundRect(bx, by, b.w, b.h, 6);
                ctx.fill();

                // Specular Bevel Highlights
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(bx + 3, by + 3, b.w - 6, 4);

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx + 1, by + 1, b.w - 2, b.h - 2);

                // Fracture Lines on Damaged Bricks
                if (b.hits < b.maxHits) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.8;
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 6;
                    b.fractures.forEach(f => {
                        ctx.beginPath();
                        ctx.moveTo(b.x + f.x1, b.y + f.y1);
                        ctx.lineTo(b.x + f.x2, b.y + f.y2);
                        ctx.stroke();
                    });
                }

                // Centered Gem Icon / Hits
                if (b.golden) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', b.x, b.y + 1);
                } else if (b.hits > 1) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'black 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${b.hits}`, b.x, b.y + 1);
                }
                ctx.restore();
            });

            // 5. Render Crystal Capsule Drops
            s.drops.forEach((d) => {
                ctx.save();
                const dropColors: Record<DropKind, string> = {
                    wide: '#00f0ff',
                    multi: '#fbbf24',
                    slow: '#a855f7',
                    life: '#10b981',
                    laser: '#f43f5e',
                };
                const dropIcons: Record<DropKind, string> = {
                    wide: '🛡️',
                    multi: '💎',
                    slow: '⏳',
                    life: '💖',
                    laser: '⚡',
                };

                const col = dropColors[d.kind];
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.strokeStyle = col;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = col;
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.roundRect(d.x - 14, d.y - 14, 28, 28, 8);
                ctx.fill();
                ctx.stroke();

                ctx.font = '13px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dropIcons[d.kind], d.x, d.y);
                ctx.restore();
            });

            // 6. Render Laser Beams
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;
            s.lasers.forEach((l) => {
                ctx.fillRect(l.x - 2.5, l.y - 12, 5, 24);
            });
            ctx.shadowBlur = 0;

            // 7. Render Crystal Shard Particles
            s.particles.forEach((p) => {
                const alpha = 1 - p.life / p.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                if (p.angle !== undefined) ctx.rotate(p.angle);

                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;

                if (p.isShard) {
                    ctx.beginPath();
                    ctx.moveTo(-p.size, -p.size);
                    ctx.lineTo(p.size, 0);
                    ctx.lineTo(0, p.size);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                }
                ctx.restore();
            });

            // 8. Render Chrome Plasma Paddle
            ctx.save();
            const pw = s.paddleWidth;
            const px = s.paddleX;
            const py = PADDLE_Y;

            // Chrome Back Bar
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(px - pw / 2, py - PADDLE_HEIGHT / 2, pw, PADDLE_HEIGHT, 8);
            ctx.fill();

            // Central Plasma Core
            const paddleCol = s.laserTimer > 0 ? '#f43f5e' : s.wideTimer > 0 ? '#fbbf24' : '#00f0ff';
            const plasmaGrad = ctx.createLinearGradient(px - pw / 2, py, px + pw / 2, py);
            plasmaGrad.addColorStop(0, '#ffffff');
            plasmaGrad.addColorStop(0.5, paddleCol);
            plasmaGrad.addColorStop(1, '#ffffff');

            ctx.fillStyle = plasmaGrad;
            ctx.shadowColor = paddleCol;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.roundRect(px - pw / 2 + 8, py - 4, pw - 16, 8, 4);
            ctx.fill();

            // Chrome Rounded End Caps
            ctx.fillStyle = '#e2e8f0';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(px - pw / 2 + 8, py, 7, 0, Math.PI * 2);
            ctx.arc(px + pw / 2 - 8, py, 7, 0, Math.PI * 2);
            ctx.fill();

            // Laser Cannons on Paddle
            if (s.laserTimer > 0) {
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(px - pw / 2 - 4, py - 14, 8, 14);
                ctx.fillRect(px + pw / 2 - 4, py - 14, 8, 14);
            }
            ctx.restore();

            // 9. Render Rainbow Light Trail Balls
            s.balls.forEach((b) => {
                ctx.save();

                // Chromatic Rainbow Trail
                const trailColors = ['#00f0ff', '#a855f7', '#ec4899', '#fbbf24', '#10b981'];
                b.trail.forEach((t, idx) => {
                    const tr = (1 - (idx + 1) / b.trail.length) * BALL_RADIUS;
                    ctx.fillStyle = trailColors[idx % trailColors.length];
                    ctx.globalAlpha = 0.5 * (1 - idx / b.trail.length);
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, tr, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Radiant Core Ball
                ctx.globalAlpha = 1.0;
                const ballGrad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, BALL_RADIUS);
                ballGrad.addColorStop(0, '#ffffff');
                ballGrad.addColorStop(0.5, '#38bdf8');
                ballGrad.addColorStop(1, '#0284c7');

                ctx.fillStyle = ballGrad;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [profileAccent]);

    // Pointer and Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                stateRef.current.keys.fire = true;
                launchBall();
                fireLaser();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = false;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') stateRef.current.keys.fire = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [launchBall, fireLaser]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const scaleX = V_WIDTH / rect.width;
        stateRef.current.touchX = clientX * scaleX;
    };

    const handlePointerDown = () => {
        launchBall();
        fireLaser();
    };

    return (
        <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            className="relative h-[65vh] max-h-[720px] min-h-[460px] w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none touch-none font-mono"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Arcade HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                {/* Score & Combo */}
                <div className="flex items-center gap-3">
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] backdrop-blur-md">
                        <div className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Puntuación</div>
                        <div className="text-lg sm:text-xl font-black text-white tabular-nums">{score}</div>
                    </div>

                    {combo > 1 && (
                        <div className="bg-amber-500/20 border border-amber-400 px-3 py-1.5 rounded-xl animate-bounce shadow-[0_0_15px_rgba(255,183,0,0.5)] backdrop-blur-md">
                            <span className="text-amber-300 font-black text-sm">COMBO x{combo}! ⚡</span>
                        </div>
                    )}

                    {/* Reveal Percentage Progress */}
                    {revealPercent > 0 && gameState === 'playing' && (
                        <div className="hidden md:flex items-center gap-1.5 bg-black/80 border border-pink-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.3)] backdrop-blur-md">
                            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                            <span className="text-[10px] text-pink-300 font-bold uppercase">RECUERDO: {revealPercent}%</span>
                        </div>
                    )}
                </div>

                {/* Active Powerup Chips */}
                <div className="hidden sm:flex items-center gap-2">
                    {activePowerups.map((p, i) => (
                        <span key={i} className="bg-fuchsia-500/20 border border-fuchsia-400 px-2.5 py-1 rounded-lg text-[10px] font-black text-fuchsia-300 backdrop-blur-md">
                            ⚡ {p}
                        </span>
                    ))}
                </div>

                {/* Level, Lives & Audio */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-xl text-right backdrop-blur-md">
                        <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Nivel {level}</div>
                        <div className="text-sm font-black text-rose-400">{'❤️'.repeat(lives)}</div>
                    </div>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Steer Buttons */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between sm:hidden pointer-events-none">
                <button
                    onPointerDown={() => (stateRef.current.keys.left = true)}
                    onPointerUp={() => (stateRef.current.keys.left = false)}
                    className="pointer-events-auto p-4 bg-cyan-500/20 border border-cyan-400/50 rounded-2xl active:bg-cyan-500/50 text-cyan-300 backdrop-blur-md"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                    onPointerDown={() => {
                        launchBall();
                        fireLaser();
                    }}
                    className="pointer-events-auto px-6 py-4 bg-gradient-to-r from-pink-500 to-amber-400 border border-pink-400 rounded-2xl active:scale-95 text-black font-black text-xs uppercase tracking-widest backdrop-blur-md shadow-lg"
                >
                    LANZAR / DISPARO 🚀
                </button>
                <button
                    onPointerDown={() => (stateRef.current.keys.right = true)}
                    onPointerUp={() => (stateRef.current.keys.right = false)}
                    className="pointer-events-auto p-4 bg-cyan-500/20 border border-cyan-400/50 rounded-2xl active:bg-cyan-500/50 text-cyan-300 backdrop-blur-md"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>

            {/* LEVEL CLEARED - Polaroid Memory Unlocked Modal */}
            {gameState === 'cleared' && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-pink-500/60 bg-[#090b17] p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(255,75,137,0.5)] relative">
                        <BrutalistCorners color="#ff4b89" size={16} />

                        <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-pink-400">
                            <Sparkles className="h-4 w-4 animate-spin text-pink-400" />
                            <span>Recuerdo Revelado · Nivel {level} Superado</span>
                        </div>

                        {/* Unlocked Photo Container */}
                        <div className="relative mx-auto mb-4 aspect-video max-h-56 overflow-hidden rounded-2xl border-2 border-pink-400/50 bg-black p-1 shadow-[0_0_20px_rgba(255,75,137,0.3)]">
                            {clearedMemory?.rawImage ? (
                                <img
                                    src={clearedMemory.memory.imageUrl}
                                    alt={clearedMemory.memory.title}
                                    className="h-full w-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-pink-950/40 text-pink-300">
                                    <Heart className="w-12 h-12 text-pink-500 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <h3 className="mb-1 text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                            {clearedMemory?.memory.title || 'Momento Inolvidable'}
                        </h3>

                        {clearedMemory?.memory.description && (
                            <p className="text-xs text-white/70 mb-4 italic">
                                &ldquo;{clearedMemory.memory.description}&rdquo;
                            </p>
                        )}

                        <div className="text-xs font-bold text-cyan-300 mb-6 bg-cyan-950/40 border border-cyan-500/30 py-1.5 px-3 rounded-lg inline-block">
                            +2,500 PUNTOS DE SINERGIA ✨
                        </div>

                        <button
                            onClick={handleNextLevel}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-amber-400 text-black font-black uppercase text-sm sm:text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,75,137,0.6)] flex items-center justify-center gap-2"
                        >
                            <span>SIGUIENTE NIVEL</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Start / Game Over Overlay */}
            {gameState !== 'playing' && gameState !== 'cleared' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-pink-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                        <div className="text-pink-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
                            SANTI & MILE • CRYSTAL PRISM ARCADE 💎
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 FIN DEL JUEGO' : 'BRICK STORM ⚡'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has alcanzado el Nivel ${level} con ${score} puntos.`
                                : 'Destruye los prismas de cristal para revelar las fotos secretas de sus recuerdos en el fondo. ¡Atrapa las gemas de poder y mantén el combo activo!'}
                        </p>

                        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-white/80">
                            <div>
                                <span className="block text-[10px] text-white/40 uppercase">Récord</span>
                                <span className="font-black text-amber-400 text-base">{highScore}</span>
                            </div>
                            {gameState === 'gameover' && (
                                <div>
                                    <span className="block text-[10px] text-white/40 uppercase">Puntos</span>
                                    <span className="font-black text-cyan-400 text-base">{score}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,75,137,0.7)]"
                        >
                            {gameState === 'gameover' ? 'JUGAR DE NUEVO 🔄' : 'INICIAR BRICK STORM 🕹️'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
