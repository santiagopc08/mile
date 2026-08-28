'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BallShooterAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, FastForward, Zap, RotateCcw, Tv, Sparkles, Trophy, Crosshair } from 'lucide-react';

interface BallShooterProps {
    accentColor?: string;
}

const COLS = 7;
const ROWS = 9;
const CELL_SIZE = 64;
const BOARD_W = COLS * CELL_SIZE; // 448
const BOARD_H = ROWS * CELL_SIZE; // 576
const V_WIDTH = 540;
const V_HEIGHT = 760;
const BOARD_X = (V_WIDTH - BOARD_W) / 2; // 46
const BOARD_Y = 65;
const FLOOR_Y = BOARD_Y + BOARD_H;

type ItemType = 'brick' | 'addBall' | 'laserRow' | 'laserCol' | 'bomb';

interface GridItem {
    id: string;
    col: number;
    row: number;
    type: ItemType;
    hp: number;
    maxHp: number;
    pulse: number;
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
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

interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

function getBrickColor(hp: number, wave: number): string {
    const ratio = Math.min(1.0, hp / Math.max(1, wave * 2));
    if (ratio > 0.75) return '#ef4444'; // Red
    if (ratio > 0.50) return '#ec4899'; // Pink
    if (ratio > 0.25) return '#f59e0b'; // Amber
    return '#22c55e'; // Green
}

export function BallShooterCanvas({ accentColor = '#00f0ff' }: BallShooterProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [wave, setWave] = useState(1);
    const [ballCount, setBallCount] = useState(10);
    const [gameState, setGameState] = useState<'menu' | 'aiming' | 'shooting' | 'gameover'>('menu');
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        items: [] as GridItem[],
        balls: [] as Ball[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        cannonPos: { x: V_WIDTH / 2, y: FLOOR_Y },
        newCannonPos: null as { x: number; y: number } | null,
        aimAngle: -Math.PI / 2,
        isAiming: false,
        ballCount: 10,
        ballsToSpawn: 0,
        spawnTimer: 0,
        extraBallsThisTurn: 0,
        score: 0,
        highScore: 0,
        wave: 1,
        combo: 0,
        speedMultiplier: 1,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'menu' as 'menu' | 'aiming' | 'shooting' | 'gameover',
        laserBeamRow: null as number | null,
        laserBeamTimer: 0,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('ball_shooter_highscore');
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

    const addShake = (intensity = 6, dur = 0.2) => {
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
                radius: 2 + Math.random() * 2.5,
                color,
                life: 0.3 + Math.random() * 0.35,
                maxLife: 0.65,
                alpha: 1.0,
            });
        }
    };

    const spawnRow = useCallback(() => {
        const s = stateRef.current;

        // Check if any existing brick reaches the floor
        for (const item of s.items) {
            if (item.type === 'brick' && item.row >= ROWS - 1) {
                s.gameState = 'gameover';
                setGameState('gameover');
                BallShooterAudio.destroy();
                addShake(14, 0.4);
                return;
            }
        }

        // Descend existing items by 1
        for (const item of s.items) {
            item.row += 1;
        }

        // Spawn new row at row 1
        for (let c = 0; c < COLS; c++) {
            const roll = Math.random();
            if (roll > 0.45) {
                const hp = s.wave * (Math.floor(Math.random() * 2) + 1);
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'brick',
                    hp,
                    maxHp: hp,
                    pulse: 0,
                });
            } else if (roll > 0.34) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'addBall',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                });
            } else if (roll > 0.26) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'laserRow',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                });
            } else if (roll > 0.20) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'bomb',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                });
            }
        }
    }, []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.items = [];
        s.balls = [];
        s.particles = [];
        s.floatingTexts = [];
        s.cannonPos = { x: V_WIDTH / 2, y: FLOOR_Y };
        s.newCannonPos = null;
        s.aimAngle = -Math.PI / 2;
        s.isAiming = false;
        s.ballCount = 10;
        s.ballsToSpawn = 0;
        s.score = 0;
        s.wave = 1;
        s.combo = 0;
        s.speedMultiplier = 1;
        s.gameState = 'aiming';

        setScore(0);
        setWave(1);
        setBallCount(10);
        setSpeedMultiplier(1);
        setGameState('aiming');

        spawnRow();
        spawnRow();
        BallShooterAudio.roundComplete();
    }, [spawnRow]);

    const shootVolley = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'aiming') return;

        s.gameState = 'shooting';
        setGameState('shooting');
        s.ballsToSpawn = s.ballCount;
        s.spawnTimer = 0;
        s.newCannonPos = null;
        s.extraBallsThisTurn = 0;
        s.combo = 0;
        s.isAiming = false;
    }, []);

    const recallBalls = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'shooting') return;
        s.balls.forEach(b => {
            b.active = false;
        });
        s.ballsToSpawn = 0;
    }, []);

    const toggleSpeed = useCallback(() => {
        const next = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
        setSpeedMultiplier(next);
        stateRef.current.speedMultiplier = next;
    }, [speedMultiplier]);

    // ── MAIN 60 FPS GAME LOOP ───────────────────────────────────────────────
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
            const dt = rawDt * s.speedMultiplier;

            // Screen shake
            if (s.shakeTime > 0) {
                s.shakeTime -= rawDt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Laser beam effect timer
            if (s.laserBeamTimer > 0) {
                s.laserBeamTimer -= rawDt;
                if (s.laserBeamTimer <= 0) s.laserBeamRow = null;
            }

            // Update particles
            s.particles.forEach(pt => {
                pt.x += pt.vx * rawDt;
                pt.y += pt.vy * rawDt;
                pt.life -= rawDt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            // Update floating texts
            s.floatingTexts.forEach(ft => {
                ft.y -= 30 * rawDt;
                ft.life -= rawDt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // Update items pulse
            s.items.forEach(item => {
                item.pulse += rawDt * 4;
            });

            // ── Shooting State Update ──
            if (s.gameState === 'shooting') {
                // Spawn stream of balls
                if (s.ballsToSpawn > 0) {
                    s.spawnTimer += dt;
                    if (s.spawnTimer >= 0.045) {
                        s.spawnTimer = 0;
                        s.ballsToSpawn--;
                        const speed = 760;
                        const vx = Math.cos(s.aimAngle) * speed;
                        const vy = Math.sin(s.aimAngle) * speed;
                        s.balls.push({
                            x: s.cannonPos.x,
                            y: s.cannonPos.y,
                            vx,
                            vy,
                            active: true,
                        });
                        BallShooterAudio.shoot();
                    }
                }

                // Physics update
                const ballRadius = 5;
                const leftB = BOARD_X + ballRadius;
                const rightB = BOARD_X + BOARD_W - ballRadius;
                const topB = BOARD_Y + ballRadius;

                for (const b of s.balls) {
                    if (!b.active) continue;

                    b.x += b.vx * dt;
                    b.y += b.vy * dt;

                    // Left / Right Walls
                    if (b.x < leftB) {
                        b.x = leftB;
                        b.vx = Math.abs(b.vx);
                    } else if (b.x > rightB) {
                        b.x = rightB;
                        b.vx = -Math.abs(b.vx);
                    }

                    // Top Ceiling
                    if (b.y < topB) {
                        b.y = topB;
                        b.vy = Math.abs(b.vy);
                    }

                    // Floor Collision
                    if (b.y >= FLOOR_Y) {
                        b.active = false;
                        if (!s.newCannonPos) {
                            s.newCannonPos = {
                                x: Math.max(leftB + 20, Math.min(rightB - 20, b.x)),
                                y: FLOOR_Y,
                            };
                        }
                    }

                    // Brick & Item Collisions
                    for (let i = s.items.length - 1; i >= 0; i--) {
                        const item = s.items[i];
                        const bx = BOARD_X + item.col * CELL_SIZE + 4;
                        const by = BOARD_Y + item.row * CELL_SIZE + 4;
                        const bw = CELL_SIZE - 8;
                        const bh = CELL_SIZE - 8;

                        const closestX = Math.max(bx, Math.min(b.x, bx + bw));
                        const closestY = Math.max(by, Math.min(b.y, by + bh));

                        const dx = b.x - closestX;
                        const dy = b.y - closestY;
                        const distSq = dx * dx + dy * dy;

                        if (distSq < ballRadius * ballRadius) {
                            if (item.type === 'brick') {
                                item.hp--;
                                s.combo++;
                                s.score += 10;
                                setScore(s.score);
                                BallShooterAudio.bounce(s.combo);

                                // Reflect velocity
                                if (Math.abs(dx) > Math.abs(dy)) {
                                    b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
                                } else {
                                    b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
                                }

                                if (item.hp <= 0) {
                                    BallShooterAudio.destroy();
                                    spawnParticles(bx + bw / 2, by + bh / 2, getBrickColor(item.maxHp, s.wave), 18, 200);
                                    s.items.splice(i, 1);
                                    addFloatingText(bx + bw / 2, by + bh / 2, '+100', '#00f0ff');
                                    s.score += 100;
                                    setScore(s.score);
                                }
                            } else if (item.type === 'addBall') {
                                s.extraBallsThisTurn++;
                                BallShooterAudio.addBall();
                                spawnParticles(bx + bw / 2, by + bh / 2, '#facc15', 14, 140);
                                addFloatingText(bx + bw / 2, by + bh / 2, '+1 BALL 🟡', '#facc15');
                                s.items.splice(i, 1);
                            } else if (item.type === 'laserRow') {
                                const targetRow = item.row;
                                BallShooterAudio.laser();
                                s.laserBeamRow = targetRow;
                                s.laserBeamTimer = 0.25;
                                addShake(10, 0.25);
                                spawnParticles(bx + bw / 2, by + bh / 2, '#00f0ff', 30, 240);
                                s.items.splice(i, 1);

                                // Damage entire row
                                s.items.forEach(other => {
                                    if (other.row === targetRow && other.type === 'brick') {
                                        other.hp = Math.max(0, other.hp - s.wave * 2);
                                    }
                                });
                                s.items = s.items.filter(other => other.type !== 'brick' || other.hp > 0);
                            } else if (item.type === 'bomb') {
                                const targetCol = item.col;
                                const targetRow = item.row;
                                BallShooterAudio.bomb();
                                addShake(14, 0.35);
                                spawnParticles(bx + bw / 2, by + bh / 2, '#ef4444', 40, 280);
                                s.items.splice(i, 1);

                                // Area damage 3x3
                                s.items.forEach(other => {
                                    if (Math.abs(other.col - targetCol) <= 1 && Math.abs(other.row - targetRow) <= 1) {
                                        if (other.type === 'brick') {
                                            other.hp = Math.max(0, other.hp - s.wave * 3);
                                        }
                                    }
                                });
                                s.items = s.items.filter(other => other.type !== 'brick' || other.hp > 0);
                            }
                            break;
                        }
                    }
                }

                // Check if turn ended
                const allDone = s.ballsToSpawn === 0 && s.balls.every(b => !b.active);
                if (allDone) {
                    s.ballCount += s.extraBallsThisTurn;
                    setBallCount(s.ballCount);
                    s.balls = [];
                    if (s.newCannonPos) s.cannonPos = s.newCannonPos;
                    s.wave++;
                    setWave(s.wave);
                    spawnRow();
                    if ((s.gameState as 'menu' | 'aiming' | 'shooting' | 'gameover') !== 'gameover') {
                        s.gameState = 'aiming';
                        setGameState('aiming');
                        BallShooterAudio.roundComplete();
                    }

                    if (s.score > s.highScore) {
                        s.highScore = s.score;
                        setHighScore(s.score);
                        localStorage.setItem('ball_shooter_highscore', s.score.toString());
                    }
                }
            }

            // ── RENDER SCENE ────────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Deep Arcade Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#04060f');
            bgGrad.addColorStop(1, '#090d1f');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Playfield Background
            ctx.fillStyle = '#060914';
            ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

            // Playfield Grid Cells
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(BOARD_X + c * CELL_SIZE, BOARD_Y + r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }

            // Playfield Borders
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);

            // Red Floor Danger Line
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(BOARD_X, FLOOR_Y);
            ctx.lineTo(BOARD_X + BOARD_W, FLOOR_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Full-Width Laser Beam Flash
            if (s.laserBeamRow !== null && s.laserBeamTimer > 0) {
                const beamY = BOARD_Y + s.laserBeamRow * CELL_SIZE + CELL_SIZE / 2;
                ctx.save();
                ctx.fillStyle = `rgba(0, 240, 255, ${s.laserBeamTimer * 3})`;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 20;
                ctx.fillRect(BOARD_X, beamY - 12, BOARD_W, 24);
                ctx.restore();
            }

            // Render Bricks & Pickups
            s.items.forEach(item => {
                const px = BOARD_X + item.col * CELL_SIZE + 4;
                const py = BOARD_Y + item.row * CELL_SIZE + 4;
                const sz = CELL_SIZE - 8;

                ctx.save();
                if (item.type === 'brick') {
                    const col = getBrickColor(item.hp, s.wave);
                    ctx.fillStyle = col;
                    ctx.shadowColor = col;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.roundRect(px, py, sz, sz, 10);
                    ctx.fill();

                    // Bevel highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(px + 4, py + 4, sz - 8, 4);

                    // Number Text
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 15px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(item.hp.toString(), px + sz / 2, py + sz / 2 + 1);
                } else if (item.type === 'addBall') {
                    const scale = 1.0 + Math.sin(item.pulse) * 0.15;
                    ctx.fillStyle = '#facc15';
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(px + sz / 2, py + sz / 2, 14 * scale, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 14px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('+', px + sz / 2, py + sz / 2 + 1);
                } else if (item.type === 'laserRow') {
                    ctx.fillStyle = '#00f0ff';
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.roundRect(px, py, sz, sz, 10);
                    ctx.fill();

                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⚡ LAS', px + sz / 2, py + sz / 2);
                } else if (item.type === 'bomb') {
                    ctx.fillStyle = '#ef4444';
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.roundRect(px, py, sz, sz, 10);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💣 TNT', px + sz / 2, py + sz / 2);
                }
                ctx.restore();
            });

            // Render Trajectory Aim Guide
            if (s.gameState === 'aiming') {
                const dirX = Math.cos(s.aimAngle);
                const dirY = Math.sin(s.aimAngle);

                ctx.save();
                for (let i = 1; i <= 24; i++) {
                    const dotX = s.cannonPos.x + dirX * (i * 22);
                    const dotY = s.cannonPos.y + dirY * (i * 22);
                    if (dotY < BOARD_Y || dotX < BOARD_X || dotX > BOARD_X + BOARD_W) break;

                    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Cannon Base Marker
                ctx.fillStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(s.cannonPos.x, s.cannonPos.y, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = 'bold 12px monospace';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(`x${s.ballCount}`, s.cannonPos.x, s.cannonPos.y + 22);
                ctx.restore();
            }

            // Render Active Balls
            s.balls.forEach(b => {
                if (b.active) {
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

            // Particles
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

            // Floating Texts
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 6;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Filter
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
    }, [crtEnabled]);

    // Touch & Pointer Aiming
    const handlePointerDown = (e: React.PointerEvent) => {
        if (stateRef.current.gameState !== 'aiming' || !containerRef.current) return;
        stateRef.current.isAiming = true;
        updateAim(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!stateRef.current.isAiming || stateRef.current.gameState !== 'aiming') return;
        updateAim(e);
    };

    const handlePointerUp = () => {
        if (!stateRef.current.isAiming || stateRef.current.gameState !== 'aiming') return;
        stateRef.current.isAiming = false;
        shootVolley();
    };

    const updateAim = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = V_WIDTH / rect.width;
        const scaleY = V_HEIGHT / rect.height;

        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        const s = stateRef.current;
        const dx = px - s.cannonPos.x;
        const dy = py - s.cannonPos.y;

        // Must aim upwards
        if (dy < -15) {
            s.aimAngle = Math.atan2(dy, dx);
            // Clamp angle between -170 deg and -10 deg
            s.aimAngle = Math.max(-Math.PI + 0.18, Math.min(-0.18, s.aimAngle));
        }
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-[74vh] max-h-[800px] min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
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
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">WAVE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{wave}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={toggleSpeed}
                        className={`px-2.5 py-1.5 border rounded-lg font-black text-xs transition-all ${
                            speedMultiplier > 1
                                ? 'border-amber-400 text-amber-400 bg-amber-950/60 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                                : 'border-white/20 text-white/60 bg-black/80'
                        }`}
                        title="Velocidad de simulación"
                    >
                        {speedMultiplier}x ⏩
                    </button>

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

            {/* Bottom Controls (Speed & Recall when shooting) */}
            {gameState === 'shooting' && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={recallBalls}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 border border-pink-400 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        <span>RECOGER BOLAS ⚡</span>
                    </button>
                </div>
            )}

            {/* Start / Game Over Modal */}
            {gameState !== 'aiming' && gameState !== 'shooting' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Ball Shooter Physics</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 FLOOR BREACHED' : 'BALL SHOOTERS 🎯'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Los bloques han tocado el suelo en la oleada ${wave}. Puntuación final: ${score}`
                                : 'Apunta y dispara la ráfaga de bolas. Reduce los números de los bloques antes de que lleguen a la línea de peligro.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'JUGAR DE NUEVO 🔄' : 'APUNTAR Y DISPARAR 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
