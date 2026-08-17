'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrickAudio, initArcadeAudio, loadMutedPreference, setMuted, isMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, RotateCcw, Play, Trophy, Shield, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    stuckToPaddle: boolean;
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
}

export function BrickStormCanvas({ accentColor = '#00e5ff' }: BrickStormProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(0);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'cleared'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [activePowerups, setActivePowerups] = useState<string[]>([]);

    // Mutable game state held in refs for 60fps loop
    const stateRef = useRef({
        paddleX: V_WIDTH / 2,
        paddleTargetX: V_WIDTH / 2,
        paddleWidth: BASE_PADDLE_WIDTH,
        balls: [] as Ball[],
        bricks: [] as Brick[],
        drops: [] as Drop[],
        lasers: [] as Laser[],
        particles: [] as Particle[],
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
        const saved = localStorage.getItem('brickstorm_highscore');
        if (saved) {
            const val = parseInt(saved, 10);
            setHighScore(val);
            stateRef.current.highScore = val;
        }
    }, []);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const buildLevel = useCallback((lvl: number) => {
        const rows = Math.min(8, 4 + Math.floor((lvl - 1) / 2));
        const boardWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
        const startX = (V_WIDTH - boardWidth) / 2 + BRICK_WIDTH / 2;

        const colors = [
            '#00e5ff', // Cyan
            '#ff007f', // Magenta
            '#ffb700', // Amber
            '#00ff66', // Lime
            '#9933ff', // Violet
            '#ff3333', // Red
        ];

        const bricks: Brick[] = [];
        let id = 1;

        for (let r = 0; r < rows; r++) {
            const rowColor = colors[r % colors.length];
            for (let c = 0; c < BRICK_COLS; c++) {
                // Random gaps in top rows for ball infiltration
                if (Math.random() < 0.08 + r * 0.01) continue;

                const isGolden = Math.random() < 0.08;
                const hits = isGolden ? 2 : 1 + Math.min(2, Math.floor((rows - 1 - r) / 2) + Math.floor((lvl - 1) / 3));

                bricks.push({
                    id: id++,
                    x: startX + c * (BRICK_WIDTH + BRICK_GAP),
                    y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
                    w: BRICK_WIDTH,
                    h: BRICK_HEIGHT,
                    hits,
                    maxHits: hits,
                    golden: isGolden,
                    color: isGolden ? '#ffd700' : rowColor,
                });
            }
        }

        stateRef.current.bricks = bricks;
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
            },
        ];
    }, []);

    const spawnParticles = (x: number, y: number, color: string, count = 12, speed = 180) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.3 + Math.random() * 0.8);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color,
                life: 0,
                maxLife: 0.35 + Math.random() * 0.4,
                size: 2 + Math.random() * 3.5,
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
    }, [buildLevel]);

    const launchBall = () => {
        const s = stateRef.current;
        s.balls.forEach((b) => {
            if (b.stuckToPaddle) {
                b.stuckToPaddle = false;
                b.vx = (Math.random() - 0.5) * 220;
                b.vy = -b.speed;
                BrickAudio.paddleHit();
            }
        });
    };

    const fireLaser = () => {
        const s = stateRef.current;
        if (s.laserTimer <= 0) return;
        const now = performance.now();
        if (now - s.lastLaserFire < 180) return;
        s.lastLaserFire = now;

        s.lasers.push(
            { x: s.paddleX - s.paddleWidth * 0.4, y: PADDLE_Y - 10, vy: -900 },
            { x: s.paddleX + s.paddleWidth * 0.4, y: PADDLE_Y - 10, vy: -900 }
        );
        BrickAudio.laserFire();
    };

    // Main Game Loop
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

            // Handle Screen Shake
            if (s.shake > 0) {
                s.shake = Math.max(0, s.shake - dt * 28);
                s.shakeOffset = {
                    x: (Math.random() - 0.5) * s.shake,
                    y: (Math.random() - 0.5) * s.shake,
                };
            } else {
                s.shakeOffset = { x: 0, y: 0 };
            }

            if (s.gameState === 'playing') {
                // Update Timers
                if (s.comboTimer > 0) {
                    s.comboTimer -= dt;
                    if (s.comboTimer <= 0) {
                        s.combo = 0;
                        setCombo(0);
                    }
                }

                if (s.wideTimer > 0) {
                    s.wideTimer -= dt;
                    s.paddleWidth = BASE_PADDLE_WIDTH * 1.5;
                    if (s.wideTimer <= 0) s.paddleWidth = BASE_PADDLE_WIDTH;
                }

                if (s.slowTimer > 0) {
                    s.slowTimer -= dt;
                }

                if (s.laserTimer > 0) {
                    s.laserTimer -= dt;
                    if (s.keys.fire) fireLaser();
                }

                // Sync active powerup badges
                const powers: string[] = [];
                if (s.wideTimer > 0) powers.push(`AMPLIO ${Math.ceil(s.wideTimer)}s`);
                if (s.slowTimer > 0) powers.push(`LENTO ${Math.ceil(s.slowTimer)}s`);
                if (s.laserTimer > 0) powers.push(`LÁSER ${Math.ceil(s.laserTimer)}s`);
                setActivePowerups(powers);

                // Paddle Movement
                const paddleSpeed = 850;
                if (s.keys.left) s.paddleTargetX -= paddleSpeed * dt;
                if (s.keys.right) s.paddleTargetX += paddleSpeed * dt;
                if (s.touchX !== null) s.paddleTargetX = s.touchX;

                s.paddleTargetX = Math.max(s.paddleWidth / 2 + 16, Math.min(V_WIDTH - s.paddleWidth / 2 - 16, s.paddleTargetX));
                s.paddleX += (s.paddleTargetX - s.paddleX) * Math.min(1, dt * 25);

                // Update Lasers
                for (let i = s.lasers.length - 1; i >= 0; i--) {
                    const l = s.lasers[i];
                    l.y += l.vy * dt;

                    let hit = false;
                    for (let j = s.bricks.length - 1; j >= 0; j--) {
                        const b = s.bricks[j];
                        if (
                            l.x >= b.x - b.w / 2 &&
                            l.x <= b.x + b.w / 2 &&
                            l.y >= b.y - b.h / 2 &&
                            l.y <= b.y + b.h / 2
                        ) {
                            hit = true;
                            b.hits -= 1;
                            spawnParticles(l.x, l.y, '#ff0055', 6, 120);

                            if (b.hits <= 0) {
                                s.score += b.golden ? 500 : 100;
                                s.bricks.splice(j, 1);
                                BrickAudio.brickDestroy(1);
                                addShake(3);
                            } else {
                                BrickAudio.brickHit(1);
                            }
                            break;
                        }
                    }

                    if (hit || l.y < 0) {
                        s.lasers.splice(i, 1);
                    }
                }

                // Update Drops
                for (let i = s.drops.length - 1; i >= 0; i--) {
                    const d = s.drops[i];
                    d.y += d.vy * dt;

                    // Collect drop with paddle
                    if (
                        d.y >= PADDLE_Y - PADDLE_HEIGHT / 2 &&
                        d.y <= PADDLE_Y + PADDLE_HEIGHT / 2 + 10 &&
                        d.x >= s.paddleX - s.paddleWidth / 2 - 12 &&
                        d.x <= s.paddleX + s.paddleWidth / 2 + 12
                    ) {
                        BrickAudio.powerupCollect();
                        spawnParticles(d.x, d.y, '#ffffff', 18, 200);

                        if (d.kind === 'wide') s.wideTimer = 12;
                        else if (d.kind === 'slow') s.slowTimer = 10;
                        else if (d.kind === 'laser') s.laserTimer = 10;
                        else if (d.kind === 'life') {
                            s.lives = Math.min(5, s.lives + 1);
                            setLives(s.lives);
                        } else if (d.kind === 'multi') {
                            const newBalls: Ball[] = [];
                            s.balls.forEach((b) => {
                                newBalls.push({
                                    ...b,
                                    vx: b.vx * Math.cos(0.4) - b.vy * Math.sin(0.4),
                                    vy: b.vx * Math.sin(0.4) + b.vy * Math.cos(0.4),
                                });
                                newBalls.push({
                                    ...b,
                                    vx: b.vx * Math.cos(-0.4) - b.vy * Math.sin(-0.4),
                                    vy: b.vx * Math.sin(-0.4) + b.vy * Math.cos(-0.4),
                                });
                            });
                            s.balls.push(...newBalls.slice(0, 4));
                        }

                        s.drops.splice(i, 1);
                        continue;
                    }

                    if (d.y > V_HEIGHT + 20) {
                        s.drops.splice(i, 1);
                    }
                }

                // Update Balls
                for (let i = s.balls.length - 1; i >= 0; i--) {
                    const b = s.balls[i];

                    if (b.stuckToPaddle) {
                        b.x = s.paddleX;
                        b.y = PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS - 2;
                        continue;
                    }

                    const speedMult = s.slowTimer > 0 ? 0.65 : 1.0;
                    b.x += b.vx * speedMult * dt;
                    b.y += b.vy * speedMult * dt;

                    // Ball trail
                    if (Math.random() < 0.4) {
                        s.particles.push({
                            x: b.x,
                            y: b.y,
                            vx: -b.vx * 0.15,
                            vy: -b.vy * 0.15,
                            color: '#00e5ff',
                            life: 0,
                            maxLife: 0.22,
                            size: 3,
                        });
                    }

                    // Left/Right Wall Bounce
                    if (b.x < BALL_RADIUS + 16) {
                        b.x = BALL_RADIUS + 16;
                        b.vx = Math.abs(b.vx);
                        BrickAudio.wallBounce();
                        addShake(1.5);
                    } else if (b.x > V_WIDTH - BALL_RADIUS - 16) {
                        b.x = V_WIDTH - BALL_RADIUS - 16;
                        b.vx = -Math.abs(b.vx);
                        BrickAudio.wallBounce();
                        addShake(1.5);
                    }

                    // Top Wall Bounce
                    if (b.y < BALL_RADIUS + 16) {
                        b.y = BALL_RADIUS + 16;
                        b.vy = Math.abs(b.vy);
                        BrickAudio.wallBounce();
                        addShake(2);
                    }

                    // Paddle Collision
                    const paddleTop = PADDLE_Y - PADDLE_HEIGHT / 2;
                    const paddleBottom = PADDLE_Y + PADDLE_HEIGHT / 2;
                    const paddleLeft = s.paddleX - s.paddleWidth / 2;
                    const paddleRight = s.paddleX + s.paddleWidth / 2;

                    if (
                        b.y + BALL_RADIUS >= paddleTop &&
                        b.y - BALL_RADIUS <= paddleBottom &&
                        b.x >= paddleLeft &&
                        b.x <= paddleRight &&
                        b.vy > 0
                    ) {
                        b.y = paddleTop - BALL_RADIUS;
                        const hitOffset = (b.x - s.paddleX) / (s.paddleWidth / 2); // -1 to +1
                        const maxAngle = (70 * Math.PI) / 180;
                        const bounceAngle = hitOffset * maxAngle;

                        const curSpeed = Math.min(820, b.speed + 12);
                        b.speed = curSpeed;
                        b.vx = Math.sin(bounceAngle) * curSpeed;
                        b.vy = -Math.cos(bounceAngle) * curSpeed;

                        BrickAudio.paddleHit();
                        spawnParticles(b.x, paddleTop, '#00e5ff', 8, 140);
                        addShake(2.5);
                    }

                    // Brick Collisions
                    for (let j = s.bricks.length - 1; j >= 0; j--) {
                        const brick = s.bricks[j];
                        const bx = brick.x;
                        const by = brick.y;
                        const hw = brick.w / 2;
                        const hh = brick.h / 2;

                        if (
                            b.x + BALL_RADIUS >= bx - hw &&
                            b.x - BALL_RADIUS <= bx + hw &&
                            b.y + BALL_RADIUS >= by - hh &&
                            b.y - BALL_RADIUS <= by + hh
                        ) {
                            // Find collision normal
                            const overlapLeft = b.x + BALL_RADIUS - (bx - hw);
                            const overlapRight = bx + hw - (b.x - BALL_RADIUS);
                            const overlapTop = b.y + BALL_RADIUS - (by - hh);
                            const overlapBottom = by + hh - (b.y - BALL_RADIUS);

                            const minOverlapX = Math.min(overlapLeft, overlapRight);
                            const minOverlapY = Math.min(overlapTop, overlapBottom);

                            if (minOverlapX < minOverlapY) {
                                b.vx = overlapLeft < overlapRight ? -Math.abs(b.vx) : Math.abs(b.vx);
                            } else {
                                b.vy = overlapTop < overlapBottom ? -Math.abs(b.vy) : Math.abs(b.vy);
                            }

                            brick.hits -= 1;
                            s.combo += 1;
                            s.comboTimer = 1.4;
                            setCombo(s.combo);

                            const points = (brick.golden ? 350 : 100) * s.combo;
                            s.score += points;
                            setScore(s.score);

                            if (s.score > s.highScore) {
                                s.highScore = s.score;
                                setHighScore(s.score);
                                localStorage.setItem('brickstorm_highscore', s.score.toString());
                            }

                            if (brick.hits <= 0) {
                                spawnParticles(bx, by, brick.color, brick.golden ? 24 : 14, 220);
                                BrickAudio.brickDestroy(s.combo);
                                addShake(brick.golden ? 6 : 3.5);

                                // Powerup Drop (14% chance)
                                if (Math.random() < 0.14) {
                                    const kinds: DropKind[] = ['wide', 'multi', 'slow', 'life', 'laser'];
                                    const kind = kinds[Math.floor(Math.random() * kinds.length)];
                                    s.drops.push({
                                        id: s.nextDropId++,
                                        x: bx,
                                        y: by,
                                        vy: 180,
                                        kind,
                                    });
                                    BrickAudio.powerupSpawn();
                                }

                                s.bricks.splice(j, 1);
                            } else {
                                spawnParticles(b.x, b.y, brick.color, 6, 100);
                                if (brick.golden) BrickAudio.goldenHit();
                                else BrickAudio.brickHit(s.combo);
                                addShake(2);
                            }
                            break;
                        }
                    }

                    // Ball Out of Bottom Bounds
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
                    } else {
                        s.balls = [
                            {
                                x: s.paddleX,
                                y: PADDLE_Y - BALL_RADIUS - 2,
                                vx: 0,
                                vy: -BASE_BALL_SPEED,
                                speed: BASE_BALL_SPEED,
                                stuckToPaddle: true,
                            },
                        ];
                    }
                }

                // Check If Level Cleared
                if (s.bricks.length === 0) {
                    s.level += 1;
                    setLevel(s.level);
                    s.score += 2000;
                    setScore(s.score);
                    BrickAudio.levelCleared();
                    buildLevel(s.level);
                }
            }

            // Update Particles
            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.life += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.96;
                p.vy *= 0.96;
                if (p.life >= p.maxLife) {
                    s.particles.splice(i, 1);
                }
            }

            // ─── RENDER ──────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            // Apply Screen Shake
            ctx.translate(s.shakeOffset.x, s.shakeOffset.y);

            // 1. Grid Cyber Background
            ctx.fillStyle = '#06060c';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x < V_WIDTH; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, V_HEIGHT);
                ctx.stroke();
            }
            for (let y = 0; y < V_HEIGHT; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(V_WIDTH, y);
                ctx.stroke();
            }

            // 2. Playfield Side Walls
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(16, 0);
            ctx.lineTo(16, V_HEIGHT);
            ctx.moveTo(V_WIDTH - 16, 0);
            ctx.lineTo(V_WIDTH - 16, V_HEIGHT);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 3. Render Bricks
            s.bricks.forEach((b) => {
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = b.golden ? 16 : 8;

                ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);

                // Inner bezel
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(b.x - b.w / 2 + 1.5, b.y - b.h / 2 + 1.5, b.w - 3, b.h - 3);

                if (b.golden) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', b.x, b.y);
                } else if (b.hits > 1) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${b.hits}`, b.x, b.y);
                }
            });
            ctx.shadowBlur = 0;

            // 4. Render Drops
            s.drops.forEach((d) => {
                const dropColors: Record<DropKind, string> = {
                    wide: '#00e5ff',
                    multi: '#ffb700',
                    slow: '#9933ff',
                    life: '#00ff66',
                    laser: '#ff0055',
                };
                const dropLabels: Record<DropKind, string> = {
                    wide: 'W',
                    multi: 'M',
                    slow: 'S',
                    life: '+',
                    laser: 'L',
                };

                const col = dropColors[d.kind];
                ctx.fillStyle = col;
                ctx.shadowColor = col;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.font = 'black 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dropLabels[d.kind], d.x, d.y);
            });
            ctx.shadowBlur = 0;

            // 5. Render Lasers
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 8;
            s.lasers.forEach((l) => {
                ctx.fillRect(l.x - 2, l.y - 10, 4, 20);
            });
            ctx.shadowBlur = 0;

            // 6. Render Particles
            s.particles.forEach((p) => {
                const alpha = 1 - p.life / p.maxLife;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            });
            ctx.globalAlpha = 1.0;

            // 7. Render Paddle
            ctx.fillStyle = s.laserTimer > 0 ? '#ff0055' : s.wideTimer > 0 ? '#ffb700' : '#00e5ff';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 16;
            ctx.fillRect(s.paddleX - s.paddleWidth / 2, PADDLE_Y - PADDLE_HEIGHT / 2, s.paddleWidth, PADDLE_HEIGHT);

            // Paddle Bezel
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(s.paddleX - s.paddleWidth / 2 + 1, PADDLE_Y - PADDLE_HEIGHT / 2 + 1, s.paddleWidth - 2, PADDLE_HEIGHT - 2);

            // Laser cannons on paddle
            if (s.laserTimer > 0) {
                ctx.fillStyle = '#ff0055';
                ctx.fillRect(s.paddleX - s.paddleWidth / 2 - 3, PADDLE_Y - 14, 6, 12);
                ctx.fillRect(s.paddleX + s.paddleWidth / 2 - 3, PADDLE_Y - 14, 6, 12);
            }
            ctx.shadowBlur = 0;

            // 8. Render Balls
            s.balls.forEach((b) => {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            ctx.restore();

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, []);

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
    }, []);

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
            className="relative h-[65vh] max-h-[680px] min-h-[420px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.8)] select-none touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Arcade HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
                {/* Score & Combo */}
                <div className="flex items-center gap-3">
                    <div className="bg-black/80 border border-cyan-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                        <div className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Puntuación</div>
                        <div className="text-lg sm:text-xl font-black text-white tabular-nums">{score}</div>
                    </div>

                    {combo > 1 && (
                        <div className="bg-amber-500/20 border border-amber-400 px-3 py-1.5 rounded-lg animate-bounce shadow-[0_0_15px_rgba(255,183,0,0.5)]">
                            <span className="text-amber-300 font-black text-sm">COMBO x{combo}!</span>
                        </div>
                    )}
                </div>

                {/* Active Powerup Chips */}
                <div className="hidden sm:flex items-center gap-2">
                    {activePowerups.map((p, i) => (
                        <span key={i} className="bg-fuchsia-500/20 border border-fuchsia-400 px-2 py-0.5 rounded text-[10px] font-black text-fuchsia-300">
                            ⚡ {p}
                        </span>
                    ))}
                </div>

                {/* Level, Lives & Controls */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="bg-black/80 border border-white/20 px-3 py-1.5 rounded-lg text-right">
                        <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Nivel {level}</div>
                        <div className="text-sm font-black text-rose-400">{'❤️'.repeat(lives)}</div>
                    </div>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
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
                    className="pointer-events-auto px-6 py-4 bg-fuchsia-500/30 border border-fuchsia-400 rounded-2xl active:bg-fuchsia-500/60 text-white font-black text-sm uppercase tracking-widest backdrop-blur-md"
                >
                    LANZAR / DISPARO
                </button>
                <button
                    onPointerDown={() => (stateRef.current.keys.right = true)}
                    onPointerUp={() => (stateRef.current.keys.right = false)}
                    className="pointer-events-auto p-4 bg-cyan-500/20 border border-cyan-400/50 rounded-2xl active:bg-cyan-500/50 text-cyan-300 backdrop-blur-md"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>

            {/* Start / Game Over Overlay */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,229,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Cyber Arcade</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 FIN DEL JUEGO' : 'BRICK STORM ⚡'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has alcanzado el Nivel ${level} con ${score} puntos.`
                                : 'Destruye todos los bloques cibernéticos, atrapa powerups (Multibola, Láser, Paleta Ancha) y mantén el combo en llamas.'}
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
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,229,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'JUGAR DE NUEVO 🔄' : 'INICIAR BRICK STORM 🕹️'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
