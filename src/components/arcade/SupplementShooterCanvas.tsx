'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SupplementAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Tv, Zap, Flame, Shield, ArrowLeft, ArrowRight, Bomb, Sparkles, Clock, Target } from 'lucide-react';

interface SupplementShooterProps {
    accentColor?: string;
}

const COLS = 10;
const ROWS = 18;
const CELL_SIZE = 34;
const BOARD_W = COLS * CELL_SIZE; // 340
const BOARD_H = ROWS * CELL_SIZE; // 612
const V_WIDTH = 540;
const V_HEIGHT = 760;
const BOARD_X = (V_WIDTH - BOARD_W) / 2; // 100
const BOARD_Y = 55;
const DANGER_ROW = 15;
const DANGER_Y = BOARD_Y + DANGER_ROW * CELL_SIZE;

interface BlockProjectile {
    id: number;
    x: number;
    y: number;
    targetCol: number;
    speed: number;
    isLaser?: boolean;
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

interface ClearingRect {
    r: number;
    c: number;
    w: number;
    h: number;
    timer: number;
    color: string;
}

const BLOCK_COLORS = [
    '#00f0ff', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#22c55e', // Lime
    '#a855f7', // Purple
    '#3b82f6', // Blue
];

export function SupplementShooterCanvas({ accentColor = '#00f0ff' }: SupplementShooterProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [stage, setStage] = useState(1);
    const [blocksCleared, setBlocksCleared] = useState(0);
    const [combo, setCombo] = useState(0);
    const [laserBombs, setLaserBombs] = useState(3);
    const [freezeTimer, setFreezeTimer] = useState(0);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        grid: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
        playerCol: 4,
        playerVisualX: BOARD_X + 4.5 * CELL_SIZE,
        projectiles: [] as BlockProjectile[],
        clearingRects: [] as ClearingRect[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        descendTimer: 0,
        descendInterval: 1.2,
        shootCooldown: 0,
        freezeTimer: 0,
        laserBombs: 3,
        score: 0,
        highScore: 0,
        stage: 1,
        blocksCleared: 0,
        combo: 0,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'ready' as 'ready' | 'playing' | 'gameover',
        keysHeld: new Set<string>(),
        touchMoveDir: 0,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('supplement_shooter_highscore');
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

    const addShake = (intensity = 8, dur = 0.25) => {
        const s = stateRef.current;
        s.shakeIntensity = intensity;
        s.shakeTime = dur;
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#facc15') => {
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.8 });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 16, speed = 160) => {
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

    // Varied procedural polyomino patterns with strategic gaps to supplement
    const spawnPattern = useCallback(() => {
        const s = stateRef.current;

        // Check if danger line reached
        for (let c = 0; c < COLS; c++) {
            if (s.grid[DANGER_ROW][c] !== 0) {
                s.gameState = 'gameover';
                setGameState('gameover');
                SupplementAudio.gameOver();
                addShake(18, 0.5);
                return;
            }
        }

        // Shift down by 3 rows
        for (let r = ROWS - 1; r >= 3; r--) {
            s.grid[r] = [...s.grid[r - 3]];
        }
        for (let r = 0; r < 3; r++) {
            s.grid[r] = Array(COLS).fill(0);
        }

        const shapeType = Math.floor(Math.random() * 4);
        const colStart = Math.floor(Math.random() * (COLS - 4)) + 1;
        const blockId = Math.floor(Math.random() * BLOCK_COLORS.length) + 1;

        if (shapeType === 0) {
            // U-Shape: 3x3 with middle bottom missing
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (r === 1 && c === 1) s.grid[r][colStart + c] = 0;
                    else if (r === 2 && c === 1) s.grid[r][colStart + c] = 0;
                    else s.grid[r][colStart + c] = blockId;
                }
            }
        } else if (shapeType === 1) {
            // H-Frame / Corner notches: 4x3 with corner notches
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 4; c++) {
                    if ((r === 2 && c === 0) || (r === 2 && c === 3) || (r === 1 && c === 2)) {
                        s.grid[r][colStart + c] = 0;
                    } else {
                        s.grid[r][colStart + c] = blockId;
                    }
                }
            }
        } else if (shapeType === 2) {
            // Cross Shape: 3x3 with corners missing
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if ((r === 0 && c === 0) || (r === 0 && c === 2) || (r === 2 && c === 0) || (r === 2 && c === 2)) {
                        s.grid[r][colStart + c] = 0;
                    } else {
                        s.grid[r][colStart + c] = blockId;
                    }
                }
            }
        } else {
            // Hollow 4x3 Ring
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 4; c++) {
                    if (r === 1 && (c === 1 || c === 2)) {
                        s.grid[r][colStart + c] = 0;
                    } else {
                        s.grid[r][colStart + c] = blockId;
                    }
                }
            }
        }
    }, []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        s.score = 0;
        s.stage = 1;
        s.blocksCleared = 0;
        s.combo = 0;
        s.laserBombs = 3;
        s.freezeTimer = 0;
        s.descendInterval = 1.2;
        s.descendTimer = 0;
        s.shootCooldown = 0;
        s.playerCol = 4;
        s.playerVisualX = BOARD_X + 4.5 * CELL_SIZE;
        s.projectiles = [];
        s.clearingRects = [];
        s.particles = [];
        s.floatingTexts = [];
        s.gameState = 'playing';

        setScore(0);
        setStage(1);
        setBlocksCleared(0);
        setCombo(0);
        setLaserBombs(3);
        setFreezeTimer(0);
        setGameState('playing');

        spawnPattern();
        spawnPattern();
        SupplementAudio.complete(6);
    }, [spawnPattern]);

    const isSolidRectangle = (r1: number, c1: number, r2: number, c2: number): boolean => {
        const s = stateRef.current;
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                if (s.grid[r][c] === 0) return false;
            }
        }
        return true;
    };

    const checkCompletedRectangles = useCallback(() => {
        const s = stateRef.current;

        // Search for solid completed rectangles (from 6x6 down to 2x2)
        for (let h = 6; h >= 2; h--) {
            for (let w = 6; w >= 2; w--) {
                for (let r = 0; r <= ROWS - h; r++) {
                    for (let c = 0; c <= COLS - w; c++) {
                        if (isSolidRectangle(r, c, r + h - 1, c + w - 1)) {
                            const count = w * h;
                            s.blocksCleared += count;
                            setBlocksCleared(s.blocksCleared);
                            s.combo++;
                            setCombo(s.combo);

                            const pts = count * 50 * s.combo * s.stage;
                            s.score += pts;
                            setScore(s.score);

                            // Add glowing rectangle highlight animation
                            s.clearingRects.push({
                                r,
                                c,
                                w,
                                h,
                                timer: 0.25,
                                color: BLOCK_COLORS[(s.grid[r][c] - 1) % BLOCK_COLORS.length] || '#00f0ff',
                            });

                            if (count >= 9) {
                                SupplementAudio.bigCombo();
                                addShake(12, 0.35);
                                addFloatingText(BOARD_X + (c + w / 2) * CELL_SIZE, BOARD_Y + (r + h / 2) * CELL_SIZE, `🔥 MEGA RECTANGLE! +${pts}`, '#00f0ff');
                            } else {
                                SupplementAudio.complete(count);
                                addShake(6, 0.2);
                                addFloatingText(BOARD_X + (c + w / 2) * CELL_SIZE, BOARD_Y + (r + h / 2) * CELL_SIZE, `+${pts} (${w}x${h})`, '#facc15');
                            }

                            // Clear completed cells & spawn particles
                            for (let dr = r; dr < r + h; dr++) {
                                for (let dc = c; dc < c + w; dc++) {
                                    const colHex = BLOCK_COLORS[(s.grid[dr][dc] - 1) % BLOCK_COLORS.length] || '#00f0ff';
                                    spawnParticles(
                                        BOARD_X + (dc + 0.5) * CELL_SIZE,
                                        BOARD_Y + (dr + 0.5) * CELL_SIZE,
                                        colHex,
                                        12,
                                        180
                                    );
                                    s.grid[dr][dc] = 0;
                                }
                            }

                            if (s.blocksCleared >= s.stage * 25) {
                                s.stage++;
                                setStage(s.stage);
                                s.descendInterval = Math.max(0.35, 1.2 - (s.stage - 1) * 0.1);
                                s.laserBombs = Math.min(5, s.laserBombs + 1);
                                setLaserBombs(s.laserBombs);
                                addFloatingText(BOARD_X + BOARD_W / 2, BOARD_Y + 140, `STAGE UP! LEVEL ${s.stage} (+1 BOMB)`, '#ec4899');
                            }

                            if (s.score > s.highScore) {
                                s.highScore = s.score;
                                setHighScore(s.score);
                                localStorage.setItem('supplement_shooter_highscore', s.score.toString());
                            }
                            return; // Re-evaluate in next frame
                        }
                    }
                }
            }
        }
    }, []);

    const shootBlock = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing' || s.shootCooldown > 0) return;
        s.shootCooldown = 0.12;

        const spawnPos = {
            x: BOARD_X + (s.playerCol + 0.5) * CELL_SIZE,
            y: DANGER_Y + 20,
        };

        s.projectiles.push({
            id: Math.random(),
            x: spawnPos.x,
            y: spawnPos.y,
            targetCol: s.playerCol,
            speed: 780,
            active: true,
        });

        SupplementAudio.shoot();
        spawnParticles(spawnPos.x, spawnPos.y, '#00f0ff', 4, 60);
    }, []);

    const fireLaserBomb = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing' || s.laserBombs <= 0) return;
        s.laserBombs--;
        setLaserBombs(s.laserBombs);

        SupplementAudio.laser();
        addShake(14, 0.4);

        // Clears the entire active column where the player is currently aiming
        const col = s.playerCol;
        for (let r = 0; r < ROWS; r++) {
            if (s.grid[r][col] !== 0) {
                spawnParticles(BOARD_X + (col + 0.5) * CELL_SIZE, BOARD_Y + (r + 0.5) * CELL_SIZE, '#ec4899', 14, 220);
                s.grid[r][col] = 0;
            }
        }

        addFloatingText(BOARD_X + (col + 0.5) * CELL_SIZE, DANGER_Y - 40, '⚡ LASER COLUMN VAPORIZED!', '#ec4899');
    }, []);

    const movePlayer = useCallback((dir: number) => {
        const s = stateRef.current;
        if (s.gameState !== 'playing') return;
        s.playerCol = Math.max(0, Math.min(COLS - 1, s.playerCol + dir));
        s.playerVisualX = BOARD_X + (s.playerCol + 0.5) * CELL_SIZE;
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
            s.shootCooldown = Math.max(0, s.shootCooldown - dt);

            // Screen shake
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Update clearing rectangle animations
            s.clearingRects.forEach(cr => {
                cr.timer -= dt;
            });
            s.clearingRects = s.clearingRects.filter(cr => cr.timer > 0);

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

            if (s.gameState === 'playing') {
                // Descend timer
                s.descendTimer += dt;
                if (s.descendTimer >= s.descendInterval) {
                    s.descendTimer = 0;

                    // Danger line check
                    for (let c = 0; c < COLS; c++) {
                        if (s.grid[DANGER_ROW][c] !== 0) {
                            s.gameState = 'gameover';
                            setGameState('gameover');
                            SupplementAudio.gameOver();
                            addShake(18, 0.5);
                            break;
                        }
                    }

                    if (s.gameState === 'playing') {
                        // Shift rows down by 1
                        for (let r = ROWS - 1; r > 0; r--) {
                            s.grid[r] = [...s.grid[r - 1]];
                        }
                        s.grid[0] = Array(COLS).fill(0);

                        if (Math.random() < 0.38) {
                            spawnPattern();
                        }
                    }
                }

                // Update Block Projectiles
                for (const proj of s.projectiles) {
                    if (!proj.active) continue;
                    proj.y -= proj.speed * dt;

                    const col = proj.targetCol;
                    const row = Math.floor((proj.y - BOARD_Y) / CELL_SIZE);

                    if (row < 0) {
                        proj.active = false;
                        continue;
                    }

                    // Check collision with lowest solid block in that column or top of grid
                    if (row >= 0 && row < ROWS) {
                        if (row === 0 || s.grid[row - 1][col] !== 0) {
                            // Plug gap!
                            s.grid[row][col] = 1; // Solid player plug block
                            proj.active = false;

                            SupplementAudio.snap();
                            spawnParticles(
                                BOARD_X + (col + 0.5) * CELL_SIZE,
                                BOARD_Y + (row + 0.5) * CELL_SIZE,
                                '#00f0ff',
                                8,
                                100
                            );

                            checkCompletedRectangles();
                        }
                    }
                }

                s.projectiles = s.projectiles.filter(p => p.active);
            }

            // ── RENDER SCENE ────────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Deep Background
            ctx.fillStyle = '#060814';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Matrix Playfield
            ctx.fillStyle = '#090d1f';
            ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

            // Playfield Grid Cells
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cx = BOARD_X + c * CELL_SIZE;
                    const cy = BOARD_Y + r * CELL_SIZE;

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);

                    const val = s.grid[r][c];
                    if (val !== 0) {
                        const colHex = BLOCK_COLORS[(val - 1) % BLOCK_COLORS.length] || '#00f0ff';
                        ctx.fillStyle = colHex;
                        ctx.shadowColor = colHex;
                        ctx.shadowBlur = 8;
                        ctx.fillRect(cx + 1.5, cy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);

                        // Highlight bevel
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(cx + 3, cy + 3, CELL_SIZE - 6, 3);
                    }
                }
            }
            ctx.shadowBlur = 0;

            // Targeting Ghost Guide Line & Ghost Landing Slot
            if (s.gameState === 'playing') {
                const targetCol = s.playerCol;
                const tX = BOARD_X + targetCol * CELL_SIZE;

                // Find lowest empty slot in target column
                let targetRow = 0;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (s.grid[r][targetCol] !== 0) {
                        targetRow = r + 1;
                        break;
                    }
                }

                // Laser Ray
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(tX + CELL_SIZE / 2, DANGER_Y + 10);
                ctx.lineTo(tX + CELL_SIZE / 2, BOARD_Y + (targetRow + 0.5) * CELL_SIZE);
                ctx.stroke();
                ctx.setLineDash([]);

                // Ghost block slot preview
                if (targetRow < ROWS) {
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(tX + 3, BOARD_Y + targetRow * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);
                }
            }

            // Clearing Rectangles Flash
            s.clearingRects.forEach(cr => {
                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = cr.color;
                ctx.shadowBlur = 16;
                ctx.strokeRect(
                    BOARD_X + cr.c * CELL_SIZE,
                    BOARD_Y + cr.r * CELL_SIZE,
                    cr.w * CELL_SIZE,
                    cr.h * CELL_SIZE
                );
                ctx.restore();
            });

            // Border Outline
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(BOARD_X - 1.5, BOARD_Y - 1.5, BOARD_W + 3, BOARD_H + 3);

            // Red Danger Line
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(BOARD_X, DANGER_Y);
            ctx.lineTo(BOARD_X + BOARD_W, DANGER_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Player Shooter Ship
            const px = s.playerVisualX;
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(px, DANGER_Y + 10);
            ctx.lineTo(px - 14, DANGER_Y + 28);
            ctx.lineTo(px + 14, DANGER_Y + 28);
            ctx.closePath();
            ctx.fill();

            // Cannon Core
            ctx.fillStyle = '#facc15';
            ctx.fillRect(px - 3, DANGER_Y + 6, 6, 6);
            ctx.shadowBlur = 0;

            // Block Projectiles
            s.projectiles.forEach(p => {
                ctx.save();
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 10;
                ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
                ctx.restore();
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
    }, [crtEnabled, checkCompletedRectangles, movePlayer, spawnPattern]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(-1);
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1);
            if (e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'ArrowUp') shootBlock();
            if (e.key === 'b' || e.key === 'B' || e.key === 'k' || e.key === 'K') fireLaserBomb();
            if (e.key === 'Enter') {
                if (stateRef.current.gameState !== 'playing') startNewGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fireLaserBomb, movePlayer, shootBlock, startNewGame]);

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
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">STAGE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{stage}</div>
                    </div>
                    <div className="bg-black/85 border border-purple-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto flex items-center gap-1.5">
                        <div className="text-[8px] uppercase tracking-widest text-purple-400 font-bold">BOMBS</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{laserBombs} 💣</div>
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
                <div className="flex items-center gap-2 bg-black/70 p-2 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <button
                        onClick={() => movePlayer(-1)}
                        className="p-4 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => movePlayer(1)}
                        className="p-4 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Laser Bomb Button */}
                    <button
                        onClick={fireLaserBomb}
                        className="p-4 bg-purple-600 active:bg-purple-400 rounded-2xl text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1"
                    >
                        <Bomb className="w-5 h-5" />
                        <span className="text-xs font-mono">{laserBombs}</span>
                    </button>

                    {/* Shoot Button */}
                    <button
                        onClick={shootBlock}
                        className="p-4 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-5 h-5" />
                        <span>DISPARAR</span>
                    </button>
                </div>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Supplement Puzzle Shmup</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 MATRIX BREACH' : 'SUPPLEMENT SHOOTER 🧩'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Los bloques han superado la línea de peligro. Has destruido ${blocksCleared} bloques con ${score} puntos.`
                                : '¡Rellena los huecos vacíos en las formas geométricas descendentes! Al completar cualquier rectángulo sólido, detona y desaparece. Usa la Guía Láser para apuntar.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'REINTENTAR MATRIZ 🔄' : 'INICIAR PARTIDA 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
