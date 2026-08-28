'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BallShooterAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Zap, Tv, Trophy, Heart, Sparkles, Crosshair } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';

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
    scaleX: number;
    scaleY: number;
    hitFlash: number;
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    trail: { x: number; y: number }[];
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
    isShard?: boolean;
}

interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

function getJellyColors(hp: number, wave: number): { top: string; bot: string; glow: string; text: string } {
    const ratio = Math.min(1.0, hp / Math.max(1, wave * 2));
    if (ratio > 0.75) {
        return { top: '#fb7185', bot: '#e11d48', glow: '#f43f5e', text: '#ffffff' }; // Ruby Red Glass
    }
    if (ratio > 0.50) {
        return { top: '#f472b6', bot: '#db2777', glow: '#ec4899', text: '#ffffff' }; // Bubblegum Pink
    }
    if (ratio > 0.25) {
        return { top: '#fbbf24', bot: '#d97706', glow: '#f59e0b', text: '#ffffff' }; // Amber Peach
    }
    return { top: '#34d399', bot: '#059669', glow: '#10b981', text: '#ffffff' }; // Emerald Mint
}

export function BallShooterCanvas({ accentColor = '#00f0ff' }: BallShooterProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();

    const elBest = scores['ballshooter']?.el || 0;
    const ellaBest = scores['ballshooter']?.ella || 0;

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [wave, setWave] = useState(1);
    const [ballCount, setBallCount] = useState(10);
    const [gameState, setGameState] = useState<'menu' | 'aiming' | 'shooting' | 'gameover'>('menu');
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

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
        cannonRecoil: 0,
        gameState: 'menu' as 'menu' | 'aiming' | 'shooting' | 'gameover',
        laserBeamRow: null as number | null,
        laserBeamTimer: 0,
    });

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

    const addShake = (intensity = 6, dur = 0.2) => {
        const s = stateRef.current;
        s.shakeIntensity = intensity;
        s.shakeTime = dur;
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#facc15') => {
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.85 });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 18, speed = 200, isShard = false) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.35 + Math.random() * 0.85);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: isShard ? 2 + Math.random() * 4 : 2 + Math.random() * 2.5,
                color,
                life: 0.35 + Math.random() * 0.4,
                maxLife: 0.75,
                alpha: 1.0,
                isShard,
            });
        }
    };

    const handleGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'gameover';
        setGameState('gameover');
        BallShooterAudio.destroy();
        addShake(16, 0.45);
        spawnParticles(V_WIDTH / 2, FLOOR_Y - 40, '#ef4444', 50, 260);

        const res = recordScore('ballshooter', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

    const spawnRow = useCallback(() => {
        const s = stateRef.current;

        // Check if any existing brick reaches the floor
        for (const item of s.items) {
            if (item.type === 'brick' && item.row >= ROWS - 1) {
                handleGameOver();
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
                    scaleX: 1,
                    scaleY: 1,
                    hitFlash: 0,
                });
            } else if (roll > 0.32) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'addBall',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                    scaleX: 1,
                    scaleY: 1,
                    hitFlash: 0,
                });
            } else if (roll > 0.24) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'laserRow',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                    scaleX: 1,
                    scaleY: 1,
                    hitFlash: 0,
                });
            } else if (roll > 0.17) {
                s.items.push({
                    id: crypto.randomUUID(),
                    col: c,
                    row: 1,
                    type: 'bomb',
                    hp: 1,
                    maxHp: 1,
                    pulse: 0,
                    scaleX: 1,
                    scaleY: 1,
                    hitFlash: 0,
                });
            }
        }
    }, [handleGameOver]);

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
        s.cannonRecoil = 0;
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

    // ── MAIN 60 FPS JELLY BOBBLE LOOP ───────────────────────────────────────
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

            // Cannon recoil decay
            if (s.cannonRecoil > 0) {
                s.cannonRecoil = Math.max(0, s.cannonRecoil - rawDt * 18);
            }

            // Update particles (water droplets & crystal shards)
            s.particles.forEach(pt => {
                pt.x += pt.vx * rawDt;
                pt.y += pt.vy * rawDt;
                pt.vy += 280 * rawDt; // Subtle gravity
                pt.life -= rawDt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            // Update floating texts
            s.floatingTexts.forEach(ft => {
                ft.y -= 32 * rawDt;
                ft.life -= rawDt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // Update items pulse & elastic squash/stretch spring
            s.items.forEach(item => {
                item.pulse += rawDt * 4;
                item.scaleX += (1 - item.scaleX) * 14 * rawDt;
                item.scaleY += (1 - item.scaleY) * 14 * rawDt;
                if (item.hitFlash > 0) {
                    item.hitFlash = Math.max(0, item.hitFlash - rawDt * 8);
                }
            });

            // ── Shooting State Update ──
            if (s.gameState === 'shooting') {
                // Spawn stream of balls
                if (s.ballsToSpawn > 0) {
                    s.spawnTimer += dt;
                    if (s.spawnTimer >= 0.042) {
                        s.spawnTimer = 0;
                        s.ballsToSpawn--;
                        s.cannonRecoil = 5.0; // Trigger barrel recoil
                        const speed = 780;
                        const vx = Math.cos(s.aimAngle) * speed;
                        const vy = Math.sin(s.aimAngle) * speed;
                        s.balls.push({
                            x: s.cannonPos.x,
                            y: s.cannonPos.y - 12,
                            vx,
                            vy,
                            active: true,
                            trail: [],
                        });
                        BallShooterAudio.shoot();
                    }
                }

                // Physics update
                const ballRadius = 6;
                const leftB = BOARD_X + ballRadius;
                const rightB = BOARD_X + BOARD_W - ballRadius;
                const topB = BOARD_Y + ballRadius;

                for (const b of s.balls) {
                    if (!b.active) continue;

                    // Update trail history
                    b.trail.unshift({ x: b.x, y: b.y });
                    if (b.trail.length > 5) b.trail.pop();

                    b.x += b.vx * dt;
                    b.y += b.vy * dt;

                    // Left / Right Walls
                    if (b.x < leftB) {
                        b.x = leftB;
                        b.vx = Math.abs(b.vx);
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
                    } else if (b.x > rightB) {
                        b.x = rightB;
                        b.vx = -Math.abs(b.vx);
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
                    }

                    // Top Ceiling
                    if (b.y < topB) {
                        b.y = topB;
                        b.vy = Math.abs(b.vy);
                        spawnParticles(b.x, b.y, '#00f0ff', 4, 80);
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

                                // Elastic Squash & Stretch
                                item.scaleX = 1.18;
                                item.scaleY = 0.84;
                                item.hitFlash = 1.0;

                                // Water droplet splash
                                const colors = getJellyColors(item.hp, s.wave);
                                spawnParticles(b.x, b.y, colors.top, 5, 120);

                                // Reflect velocity
                                if (Math.abs(dx) > Math.abs(dy)) {
                                    b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
                                } else {
                                    b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
                                }

                                if (item.hp <= 0) {
                                    BallShooterAudio.destroy();
                                    spawnParticles(bx + bw / 2, by + bh / 2, colors.top, 24, 220, true);
                                    s.items.splice(i, 1);
                                    addFloatingText(bx + bw / 2, by + bh / 2, '+100 💎', '#00f0ff');
                                    s.score += 100;
                                    setScore(s.score);
                                }
                            } else if (item.type === 'addBall') {
                                s.extraBallsThisTurn++;
                                BallShooterAudio.addBall();
                                spawnParticles(bx + bw / 2, by + bh / 2, '#facc15', 18, 160);
                                addFloatingText(bx + bw / 2, by + bh / 2, '+1 BOLA 💖', '#f472b6');
                                s.items.splice(i, 1);
                            } else if (item.type === 'laserRow') {
                                const targetRow = item.row;
                                BallShooterAudio.laser();
                                s.laserBeamRow = targetRow;
                                s.laserBeamTimer = 0.28;
                                addShake(12, 0.25);
                                spawnParticles(bx + bw / 2, by + bh / 2, '#00f0ff', 35, 260);
                                s.items.splice(i, 1);

                                // Damage entire row
                                s.items.forEach(other => {
                                    if (other.row === targetRow && other.type === 'brick') {
                                        other.hp = Math.max(0, other.hp - s.wave * 2);
                                        other.hitFlash = 1.0;
                                    }
                                });
                                s.items = s.items.filter(other => other.type !== 'brick' || other.hp > 0);
                            } else if (item.type === 'bomb') {
                                const targetCol = item.col;
                                const targetRow = item.row;
                                BallShooterAudio.bomb();
                                addShake(15, 0.35);
                                spawnParticles(bx + bw / 2, by + bh / 2, '#ef4444', 45, 290);
                                s.items.splice(i, 1);

                                // Area damage 3x3
                                s.items.forEach(other => {
                                    if (Math.abs(other.col - targetCol) <= 1 && Math.abs(other.row - targetRow) <= 1) {
                                        if (other.type === 'brick') {
                                            other.hp = Math.max(0, other.hp - s.wave * 3);
                                            other.hitFlash = 1.0;
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

            // 1. DEEP VIBRANT COSMIC BACKGROUND
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#090417');
            bgGrad.addColorStop(0.5, '#12082b');
            bgGrad.addColorStop(1, '#05020c');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // 2. PLAYFIELD GLASS CONTAINER
            ctx.fillStyle = 'rgba(10, 6, 25, 0.75)';
            ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

            // Subtle Glass Grid Dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    ctx.beginPath();
                    ctx.arc(BOARD_X + c * CELL_SIZE + CELL_SIZE / 2, BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Playfield Neon Borders
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);
            ctx.shadowBlur = 0;

            // Red Floor Danger Glow Line
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(BOARD_X, FLOOR_Y);
            ctx.lineTo(BOARD_X + BOARD_W, FLOOR_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Full-Width Laser Beam Flash
            if (s.laserBeamRow !== null && s.laserBeamTimer > 0) {
                const beamY = BOARD_Y + s.laserBeamRow * CELL_SIZE + CELL_SIZE / 2;
                ctx.save();
                ctx.fillStyle = `rgba(0, 240, 255, ${s.laserBeamTimer * 3.5})`;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 24;
                ctx.fillRect(BOARD_X, beamY - 14, BOARD_W, 28);
                ctx.restore();
            }

            // 3. RENDER GLASSMORPHIC JELLY BRICKS & SPECIAL PICKUPS
            s.items.forEach(item => {
                const cx = BOARD_X + item.col * CELL_SIZE + CELL_SIZE / 2;
                const cy = BOARD_Y + item.row * CELL_SIZE + CELL_SIZE / 2;
                const sz = CELL_SIZE - 8;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(item.scaleX, item.scaleY);

                if (item.type === 'brick') {
                    const colors = getJellyColors(item.hp, s.wave);

                    // Liquid Glass Jelly Body
                    const jellyGrad = ctx.createLinearGradient(0, -sz / 2, 0, sz / 2);
                    jellyGrad.addColorStop(0, colors.top);
                    jellyGrad.addColorStop(1, colors.bot);

                    ctx.fillStyle = jellyGrad;
                    ctx.shadowColor = colors.glow;
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.roundRect(-sz / 2, -sz / 2, sz, sz, 14);
                    ctx.fill();

                    // Hit Flash
                    if (item.hitFlash > 0) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${item.hitFlash * 0.7})`;
                        ctx.beginPath();
                        ctx.roundRect(-sz / 2, -sz / 2, sz, sz, 14);
                        ctx.fill();
                    }

                    // Top Specular Glass Bevel Highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.beginPath();
                    ctx.roundRect(-sz / 2 + 5, -sz / 2 + 4, sz - 10, 6, 3);
                    ctx.fill();

                    // Centered HP Number with Drop Shadow
                    ctx.fillStyle = '#000000';
                    ctx.font = 'black 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(item.hp.toString(), 0, 1.5);

                    ctx.fillStyle = colors.text;
                    ctx.fillText(item.hp.toString(), 0, 0);
                } else if (item.type === 'addBall') {
                    // Floating Love Heart Gem (+1 Ball)
                    const pulse = 1.0 + Math.sin(item.pulse) * 0.12;
                    ctx.scale(pulse, pulse);

                    // Glass Bubble
                    ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
                    ctx.strokeStyle = '#f472b6';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ec4899';
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.arc(0, 0, 16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // Floating Pink Heart Icon
                    ctx.fillStyle = '#fde047';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💖', 0, 0);
                } else if (item.type === 'laserRow') {
                    // Holographic Prism Laser
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.roundRect(-sz / 2 + 2, -sz / 2 + 2, sz - 4, sz - 4, 12);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⚡ LAS', 0, 0);
                } else if (item.type === 'bomb') {
                    // Shaking Cartoon Bomb (TNT)
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.roundRect(-sz / 2 + 2, -sz / 2 + 2, sz - 4, sz - 4, 12);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💣 TNT', 0, 0);
                }
                ctx.restore();
            });

            // 4. ANIMATED LASER AIM GUIDE WITH WALL REFLECTION
            if (s.gameState === 'aiming') {
                ctx.save();
                const speed = 780;
                let rx = s.cannonPos.x;
                let ry = s.cannonPos.y - 12;
                let rvx = Math.cos(s.aimAngle) * speed;
                let rvy = Math.sin(s.aimAngle) * speed;

                let points: { x: number; y: number }[] = [{ x: rx, y: ry }];

                // Calculate primary and reflected ray
                for (let step = 0; step < 26; step++) {
                    rx += (rvx / speed) * 18;
                    ry += (rvy / speed) * 18;

                    // Wall reflection
                    if (rx < BOARD_X + 6) {
                        rx = BOARD_X + 6;
                        rvx = Math.abs(rvx);
                    } else if (rx > BOARD_X + BOARD_W - 6) {
                        rx = BOARD_X + BOARD_W - 6;
                        rvx = -Math.abs(rvx);
                    }

                    points.push({ x: rx, y: ry });
                    if (ry < BOARD_Y) break;
                }

                // Draw pulsing laser dots
                points.forEach((pt, idx) => {
                    if (idx === 0) return;
                    const beadScale = 1.0 - (idx / points.length) * 0.4;
                    ctx.fillStyle = idx % 2 === 0 ? '#00f0ff' : '#ec4899';
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 3 * beadScale, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Target Impact Reticle at end of beam
                const lastPt = points[points.length - 1];
                if (lastPt) {
                    ctx.strokeStyle = '#facc15';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(lastPt.x, lastPt.y, 8, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // 5. CUTE ARTICULATED BUBBLE CANNON
            ctx.save();
            ctx.translate(s.cannonPos.x, s.cannonPos.y);

            // Chrome Base Dome with Pulsing Ring
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Swiveling Barrel with Recoil
            ctx.save();
            ctx.rotate(s.aimAngle + Math.PI / 2);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(-5, -24 + s.cannonRecoil, 10, 20, 4);
            ctx.fill();
            ctx.restore();

            // Ball Count Badge
            ctx.fillStyle = '#fde047';
            ctx.font = 'black 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`x${s.ballCount} 🔮`, 0, 24);
            ctx.restore();

            // 6. RENDER ACTIVE LIQUID GLASS MARBLES WITH TRAIL
            s.balls.forEach(b => {
                if (b.active) {
                    ctx.save();

                    // Render Motion Trail
                    b.trail.forEach((t, i) => {
                        const tr = (1 - (i + 1) / b.trail.length) * 4;
                        ctx.fillStyle = `rgba(0, 240, 255, ${0.4 * (1 - i / b.trail.length)})`;
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, tr, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    // Glass Ball Body
                    const ballGrad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, 6);
                    ballGrad.addColorStop(0, '#ffffff');
                    ballGrad.addColorStop(0.4, '#38bdf8');
                    ballGrad.addColorStop(1, '#6366f1');

                    ctx.fillStyle = ballGrad;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

            // 7. PARTICLES & FLOATING TEXTS
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
                ctx.font = 'black 14px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // 8. CRT SCANLINES OVERLAY
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
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
            className="relative h-[74vh] max-h-[820px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Dashboard HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    {/* Score */}
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)] backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">PUNTUACIÓN</div>
                        <div className="text-sm sm:text-base font-black text-white tabular-nums">{score}</div>
                    </div>

                    {/* Wave */}
                    <div className="bg-black/85 border border-pink-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.3)] backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">OLEADA</div>
                        <div className="text-sm sm:text-base font-black text-white tabular-nums">{wave}</div>
                    </div>

                    {/* High Score Él vs Ella */}
                    <div className="bg-black/85 border border-amber-500/50 px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">RÉCORD</div>
                        <div className="text-sm sm:text-base font-black text-yellow-300 tabular-nums">{highScore}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Speed Toggle */}
                    <button
                        onClick={toggleSpeed}
                        className={`px-3 py-1.5 border rounded-xl font-black text-xs transition-all shadow-lg ${
                            speedMultiplier > 1
                                ? 'border-amber-400 text-amber-400 bg-amber-950/70 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                                : 'border-white/20 text-white/60 bg-black/80'
                        }`}
                        title="Velocidad de simulación"
                    >
                        {speedMultiplier}x ⏩
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

            {/* Bottom Controls (Recall when shooting) */}
            {gameState === 'shooting' && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={recallBalls}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 border border-pink-400 rounded-2xl text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(236,72,153,0.6)] active:scale-95 transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        <span>RECOGER BOLAS ⚡</span>
                    </button>
                </div>
            )}

            {/* Start / Game Over Modal */}
            {gameState !== 'aiming' && gameState !== 'shooting' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-pink-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                        <div className="text-pink-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
                            SANTI & MILE • LIQUID BOBBLE POP 🔮
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 FLOOR BREACHED' : 'BALL SHOOTER 🎯'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Los bloques de gelatina han tocado el suelo en la oleada ${wave}. Puntuación final: ${score}`
                                : 'Apunta y dispara la ráfaga de orbes de cristal. Haz rebotar las bolas contra las paredes para destruir los bloques antes de que lleguen abajo.'}
                        </p>

                        {gameState === 'gameover' && lastRecordResult && (
                            <div className="mb-6 p-3 bg-pink-950/50 border border-pink-500/40 rounded-xl text-xs text-pink-300">
                                {lastRecordResult.isNewPersonalBest && <div className="font-bold text-yellow-400 mb-1">🏆 ¡NUEVO RÉCORD PERSONAL!</div>}
                                <div>Monedas de Sinergia Ganadas: <span className="font-bold text-yellow-400">+{lastRecordResult.coinsEarned} 🪙</span></div>
                            </div>
                        )}

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-[#ff4b89] via-fuchsia-500 to-cyan-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,75,137,0.7)]"
                        >
                            {gameState === 'gameover' ? 'JUGAR DE NUEVO 🔄' : 'APUNTAR Y DISPARAR 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
