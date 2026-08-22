'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SupplementAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Tv, Zap, ArrowLeft, ArrowRight, Bomb, Sparkles, Trophy, RotateCcw, ShieldAlert } from 'lucide-react';
import { useArcadePhotos, StylizedMemory } from '@/hooks/useArcadePhotos';

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
const BOARD_Y = 48;
const DANGER_ROW = 15;
const DANGER_Y = BOARD_Y + DANGER_ROW * CELL_SIZE;

interface BlockProjectile {
    id: number;
    x: number;
    y: number;
    col: number;
    speed: number;
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
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    timer: number;
    maxTimer: number;
    color: string;
}

interface HoloFlash {
    memory: StylizedMemory;
    timer: number;
    maxTimer: number;
}

const BLOCK_COLORS = [
    '#00f0ff', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#22c55e', // Lime
    '#a855f7', // Purple
    '#3b82f6', // Blue
];

// Pre-designed authentic Quarth puzzle patterns (polyominos with strategic missing slots)
interface PatternDef {
    h: number;
    w: number;
    grid: number[][]; // 1 = solid block, 0 = gap to supplement
}

const PATTERN_TEMPLATES: PatternDef[] = [
    // 1. Bottom-Center Notch (3x3, needs 1 block)
    {
        h: 3,
        w: 3,
        grid: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 0, 1],
        ],
    },
    // 2. Deep U-Channel (3x3, needs 2 blocks)
    {
        h: 3,
        w: 3,
        grid: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
        ],
    },
    // 3. Corner L-Notch (3x3, needs 1 block)
    {
        h: 3,
        w: 3,
        grid: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 0],
        ],
    },
    // 4. Center Hole / Donut (3x3, needs 1 block)
    {
        h: 3,
        w: 3,
        grid: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
        ],
    },
    // 5. Dual Bottom Corner Notches (4x3, needs 2 blocks)
    {
        h: 3,
        w: 4,
        grid: [
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [0, 1, 1, 0],
        ],
    },
    // 6. Central Arch / Tunnel (4x3, needs 2 blocks)
    {
        h: 3,
        w: 4,
        grid: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
        ],
    },
    // 7. Double Keyhole (4x2, needs 2 blocks)
    {
        h: 2,
        w: 4,
        grid: [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
        ],
    },
    // 8. Inverted T-Notch (3x2, needs 2 blocks)
    {
        h: 2,
        w: 3,
        grid: [
            [1, 1, 1],
            [0, 1, 0],
        ],
    },
    // 9. Wide Notch (5x3, needs 3 blocks)
    {
        h: 3,
        w: 5,
        grid: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
    },
];

export function SupplementShooterCanvas({ accentColor = '#00f0ff' }: SupplementShooterProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { stylizedMemories, accentColor: profileAccent } = useArcadePhotos(BOARD_W, BOARD_H);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [stage, setStage] = useState(1);
    const [blocksCleared, setBlocksCleared] = useState(0);
    const [combo, setCombo] = useState(0);
    const [laserBombs, setLaserBombs] = useState(3);
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
        holoFlash: null as HoloFlash | null,
        // Smooth descent variables
        descendAccumulator: 0,
        descendStepTime: 2.4, // Seconds per 1-row descent (decreases with stage)
        descendVisualOffset: 0, // 0 to CELL_SIZE (smooth sub-pixel scroll)
        rowsSinceLastSpawn: 0,
        shootCooldown: 0,
        laserBombs: 3,
        score: 0,
        highScore: 0,
        stage: 1,
        blocksCleared: 0,
        combo: 0,
        comboTimer: 0,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'ready' as 'ready' | 'playing' | 'gameover',
        keysHeld: new Set<string>(),
        isDragging: false,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('supplement_shooter_highscore');
        if (saved) {
            const val = parseInt(saved, 10);
            if (!isNaN(val)) {
                setHighScore(val);
                stateRef.current.highScore = val;
            }
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
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.9 });
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

    // Spawns a pattern into rows 0..h-1 if the top of the board is clear
    const spawnPatternAtCeiling = useCallback(() => {
        const s = stateRef.current;
        const template = PATTERN_TEMPLATES[Math.floor(Math.random() * PATTERN_TEMPLATES.length)];
        const colStart = Math.floor(Math.random() * (COLS - template.w + 1));
        const colorId = Math.floor(Math.random() * BLOCK_COLORS.length) + 1;

        // Check if top rows are clear
        let canSpawn = true;
        for (let r = 0; r < template.h; r++) {
            for (let c = 0; c < template.w; c++) {
                if (s.grid[r][colStart + c] !== 0) {
                    canSpawn = false;
                    break;
                }
            }
            if (!canSpawn) break;
        }

        if (canSpawn) {
            for (let r = 0; r < template.h; r++) {
                for (let c = 0; c < template.w; c++) {
                    if (template.grid[r][c] === 1) {
                        s.grid[r][colStart + c] = colorId;
                    }
                }
            }
            s.rowsSinceLastSpawn = 0;
        }
    }, []);

    // ── TRUE QUARTH RECTANGLE CHECKER ───────────────────────────────────────
    // In Quarth, a group of blocks clears ONLY when it forms a complete, solid
    // rectangle with NO jagged protrusions or un-supplemented holes!
    const checkQuarthRectangles = useCallback(() => {
        const s = stateRef.current;
        let anyCleared = false;

        while (true) {
            let bestRect: { r1: number; c1: number; r2: number; c2: number; area: number; colorId: number } | null = null;

            // Search all possible bounding boxes from largest area down to 2x2
            for (let h = 7; h >= 2; h--) {
                for (let w = 7; w >= 2; w--) {
                    for (let r1 = 0; r1 <= ROWS - h; r1++) {
                        const r2 = r1 + h - 1;
                        for (let c1 = 0; c1 <= COLS - w; c1++) {
                            const c2 = c1 + w - 1;

                            // 1. Check if all cells inside the rectangle are solid (non-zero)
                            let isSolid = true;
                            let firstColor = 0;
                            for (let r = r1; r <= r2; r++) {
                                for (let c = c1; c <= c2; c++) {
                                    const val = s.grid[r][c];
                                    if (val === 0) {
                                        isSolid = false;
                                        break;
                                    }
                                    if (firstColor === 0) firstColor = val;
                                }
                                if (!isSolid) break;
                            }

                            if (!isSolid) continue;

                            // 2. Check Boundary Isolation: Ensure NO connected blocks stick out
                            // Top edge: row above must be empty
                            let isolated = true;
                            if (r1 > 0) {
                                for (let c = c1; c <= c2; c++) {
                                    if (s.grid[r1 - 1][c] !== 0) {
                                        isolated = false;
                                        break;
                                    }
                                }
                            }
                            if (!isolated) continue;

                            // Bottom edge: row below must be empty
                            if (r2 < ROWS - 1) {
                                for (let c = c1; c <= c2; c++) {
                                    if (s.grid[r2 + 1][c] !== 0) {
                                        isolated = false;
                                        break;
                                    }
                                }
                            }
                            if (!isolated) continue;

                            // Left edge: column to the left must be empty
                            if (c1 > 0) {
                                for (let r = r1; r <= r2; r++) {
                                    if (s.grid[r][c1 - 1] !== 0) {
                                        isolated = false;
                                        break;
                                    }
                                }
                            }
                            if (!isolated) continue;

                            // Right edge: column to the right must be empty
                            if (c2 < COLS - 1) {
                                for (let r = r1; r <= r2; r++) {
                                    if (s.grid[r][c2 + 1] !== 0) {
                                        isolated = false;
                                        break;
                                    }
                                }
                            }
                            if (!isolated) continue;

                            // If solid and perfectly isolated, this is a completed Quarth rectangle!
                            const area = w * h;
                            if (!bestRect || area > bestRect.area) {
                                bestRect = { r1, c1, r2, c2, area, colorId: firstColor };
                            }
                        }
                    }
                }
            }

            if (!bestRect) break;

            anyCleared = true;
            const { r1, c1, r2, c2, area, colorId } = bestRect;
            const w = c2 - c1 + 1;
            const h = r2 - r1 + 1;

            s.blocksCleared += area;
            setBlocksCleared(s.blocksCleared);

            s.combo++;
            s.comboTimer = 3.5;
            setCombo(s.combo);

            const pts = area * 60 * s.combo * s.stage;
            s.score += pts;
            setScore(s.score);

            const repColor = BLOCK_COLORS[(colorId - 1 + BLOCK_COLORS.length) % BLOCK_COLORS.length] || '#00f0ff';

            // Flash highlight box
            s.clearingRects.push({
                r1,
                c1,
                r2,
                c2,
                timer: 0.35,
                maxTimer: 0.35,
                color: repColor,
            });

            // Trigger Holographic Photo Flash on Mega Rectangle or Combo >= 3
            if ((area >= 8 || s.combo >= 3) && stylizedMemories.length > 0) {
                const randomMem = stylizedMemories[Math.floor(Math.random() * stylizedMemories.length)];
                s.holoFlash = {
                    memory: randomMem,
                    timer: 2.2,
                    maxTimer: 2.2,
                };
            }

            // Audio & Screen Effects
            if (area >= 9) {
                SupplementAudio.bigCombo();
                addShake(15, 0.45);
                addFloatingText(
                    BOARD_X + (c1 + w / 2) * CELL_SIZE,
                    BOARD_Y + (r1 + h / 2) * CELL_SIZE,
                    `🔥 MEGA RECTÁNGULO! +${pts}`,
                    '#00f0ff'
                );
            } else {
                SupplementAudio.complete(area);
                addShake(7, 0.22);
                addFloatingText(
                    BOARD_X + (c1 + w / 2) * CELL_SIZE,
                    BOARD_Y + (r1 + h / 2) * CELL_SIZE,
                    `+${pts} (${w}×${h})`,
                    '#facc15'
                );
            }

            // Clear the cells and burst particles
            for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                    const cHex = BLOCK_COLORS[(s.grid[r][c] - 1 + BLOCK_COLORS.length) % BLOCK_COLORS.length] || '#00f0ff';
                    spawnParticles(
                        BOARD_X + (c + 0.5) * CELL_SIZE,
                        BOARD_Y + (r + 0.5) * CELL_SIZE,
                        cHex,
                        12,
                        170
                    );
                    s.grid[r][c] = 0;
                }
            }

            // Stage Progression (every 20 blocks cleared)
            if (s.blocksCleared >= s.stage * 20) {
                s.stage++;
                setStage(s.stage);
                s.descendStepTime = Math.max(0.8, 2.4 - (s.stage - 1) * 0.18);
                s.laserBombs = Math.min(5, s.laserBombs + 1);
                setLaserBombs(s.laserBombs);
                addFloatingText(BOARD_X + BOARD_W / 2, BOARD_Y + 120, `⚡ STAGE UP! LEVEL ${s.stage} (+1 BOMBA)`, '#ec4899');
            }

            // High Score
            if (s.score > s.highScore) {
                s.highScore = s.score;
                setHighScore(s.score);
                localStorage.setItem('supplement_shooter_highscore', s.score.toString());
            }
        }

        return anyCleared;
    }, [stylizedMemories]);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        s.score = 0;
        s.stage = 1;
        s.blocksCleared = 0;
        s.combo = 0;
        s.comboTimer = 0;
        s.laserBombs = 3;
        s.descendStepTime = 2.4;
        s.descendAccumulator = 0;
        s.descendVisualOffset = 0;
        s.rowsSinceLastSpawn = 0;
        s.shootCooldown = 0;
        s.playerCol = 4;
        s.playerVisualX = BOARD_X + 4.5 * CELL_SIZE;
        s.projectiles = [];
        s.clearingRects = [];
        s.particles = [];
        s.floatingTexts = [];
        s.holoFlash = null;
        s.gameState = 'playing';

        setScore(0);
        setStage(1);
        setBlocksCleared(0);
        setCombo(0);
        setLaserBombs(3);
        setGameState('playing');

        // Spawn initial starting puzzle pattern
        spawnPatternAtCeiling();

        // Shift down 4 rows
        for (let r = ROWS - 1; r >= 4; r--) {
            s.grid[r] = [...s.grid[r - 4]];
        }
        for (let r = 0; r < 4; r++) {
            s.grid[r] = Array(COLS).fill(0);
        }

        // Spawn second puzzle pattern at ceiling
        spawnPatternAtCeiling();

        SupplementAudio.complete(4);
    }, [spawnPatternAtCeiling]);

    // Shoot single block
    const shootBlock = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing' || s.shootCooldown > 0) return;
        s.shootCooldown = 0.12;

        const targetCol = s.playerCol;

        // Check if top of column is overflowing past danger line
        if (s.grid[DANGER_ROW - 1][targetCol] !== 0) {
            addFloatingText(BOARD_X + (targetCol + 0.5) * CELL_SIZE, DANGER_Y - 20, '⚠️ COLUMNA LLENA', '#ef4444');
            return;
        }

        const spawnPos = {
            x: BOARD_X + (targetCol + 0.5) * CELL_SIZE,
            y: DANGER_Y + 16,
        };

        s.projectiles.push({
            id: Math.random(),
            x: spawnPos.x,
            y: spawnPos.y,
            col: targetCol,
            speed: 880,
            active: true,
        });

        SupplementAudio.shoot();
        spawnParticles(spawnPos.x, spawnPos.y, '#00f0ff', 5, 70);
    }, []);

    // Laser Bomb: Clears player column and adjacent columns
    const fireLaserBomb = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'playing' || s.laserBombs <= 0) return;
        s.laserBombs--;
        setLaserBombs(s.laserBombs);

        SupplementAudio.laser();
        addShake(16, 0.45);

        const col = s.playerCol;
        const colsToClear = [col - 1, col, col + 1].filter(c => c >= 0 && c < COLS);

        colsToClear.forEach(c => {
            for (let r = 0; r < ROWS; r++) {
                if (s.grid[r][c] !== 0) {
                    spawnParticles(BOARD_X + (c + 0.5) * CELL_SIZE, BOARD_Y + (r + 0.5) * CELL_SIZE, '#ec4899', 14, 220);
                    s.grid[r][c] = 0;
                }
            }
        });

        addFloatingText(BOARD_X + (col + 0.5) * CELL_SIZE, DANGER_Y - 40, '⚡ LÁSER TRIPLE VAPORIZADO!', '#ec4899');
    }, []);

    const movePlayer = useCallback((dir: number) => {
        const s = stateRef.current;
        if (s.gameState !== 'playing') return;
        s.playerCol = Math.max(0, Math.min(COLS - 1, s.playerCol + dir));
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

            // Smooth player visual ship positioning
            const targetVisualX = BOARD_X + (s.playerCol + 0.5) * CELL_SIZE;
            s.playerVisualX += (targetVisualX - s.playerVisualX) * Math.min(1, dt * 28);

            // Screen shake
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Combo timer decay
            if (s.comboTimer > 0) {
                s.comboTimer -= dt;
                if (s.comboTimer <= 0) {
                    s.combo = 0;
                    setCombo(0);
                }
            }

            // Update HoloFlash timer
            if (s.holoFlash && s.holoFlash.timer > 0) {
                s.holoFlash.timer -= dt;
                if (s.holoFlash.timer <= 0) {
                    s.holoFlash = null;
                }
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
                ft.y -= 32 * dt;
                ft.life -= dt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            if (s.gameState === 'playing') {
                // ── SMOOTH DESCENT SYSTEM ──
                s.descendAccumulator += dt;
                s.descendVisualOffset = (s.descendAccumulator / s.descendStepTime) * CELL_SIZE;

                if (s.descendAccumulator >= s.descendStepTime) {
                    s.descendAccumulator = 0;
                    s.descendVisualOffset = 0;

                    // Danger line breach check
                    for (let c = 0; c < COLS; c++) {
                        if (s.grid[DANGER_ROW - 1][c] !== 0) {
                            s.gameState = 'gameover';
                            setGameState('gameover');
                            SupplementAudio.gameOver();
                            addShake(20, 0.6);
                            break;
                        }
                    }

                    if (s.gameState === 'playing') {
                        // Shift all rows down by 1
                        for (let r = ROWS - 1; r > 0; r--) {
                            s.grid[r] = [...s.grid[r - 1]];
                        }
                        s.grid[0] = Array(COLS).fill(0);

                        s.rowsSinceLastSpawn++;

                        // Spawn next pattern every 4-5 rows or when top 4 rows are clear
                        if (s.rowsSinceLastSpawn >= 5) {
                            spawnPatternAtCeiling();
                        }
                    }
                }

                // ── UPDATE BLOCK BULLET PROJECTILES (PHYSICAL COLLISION) ──
                for (let i = s.projectiles.length - 1; i >= 0; i--) {
                    const proj = s.projectiles[i];
                    if (!proj.active) continue;

                    proj.y -= proj.speed * dt;
                    const col = proj.col;

                    // Find the visual top-of-block boundary in this column
                    // Lowest block in this column:
                    let lowestRow = -1;
                    for (let r = ROWS - 1; r >= 0; r--) {
                        if (s.grid[r][col] !== 0) {
                            lowestRow = r;
                            break;
                        }
                    }

                    let targetSnapRow = 0;
                    let targetContactY = BOARD_Y + s.descendVisualOffset;

                    if (lowestRow !== -1) {
                        targetSnapRow = lowestRow + 1;
                        targetContactY = BOARD_Y + targetSnapRow * CELL_SIZE + s.descendVisualOffset;
                    }

                    // Collision triggered when projectile reaches contact Y
                    if (proj.y <= targetContactY) {
                        proj.active = false;
                        s.projectiles.splice(i, 1);

                        if (targetSnapRow < DANGER_ROW) {
                            s.grid[targetSnapRow][col] = 1; // Solid player cyan block
                            SupplementAudio.snap();

                            spawnParticles(
                                BOARD_X + (col + 0.5) * CELL_SIZE,
                                BOARD_Y + (targetSnapRow + 0.5) * CELL_SIZE,
                                '#00f0ff',
                                10,
                                130
                            );

                            // Check if a Quarth rectangle was completed!
                            checkQuarthRectangles();

                            // Re-check danger line breach
                            if (targetSnapRow >= DANGER_ROW - 1) {
                                for (let c = 0; c < COLS; c++) {
                                    if (s.grid[DANGER_ROW - 1][c] !== 0) {
                                        s.gameState = 'gameover';
                                        setGameState('gameover');
                                        SupplementAudio.gameOver();
                                        addShake(18, 0.5);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── RENDER 60 FPS SCENE ──────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Deep Background
            ctx.fillStyle = '#050711';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Matrix Playfield Background
            ctx.fillStyle = '#080d20';
            ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

            // Render Holographic Photo Flash on Combos / Mega Rectangles
            if (s.holoFlash && s.holoFlash.memory.holoCanvas) {
                ctx.save();
                const progress = s.holoFlash.timer / s.holoFlash.maxTimer;
                ctx.globalAlpha = progress * 0.45;
                ctx.drawImage(s.holoFlash.memory.holoCanvas, BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

                // Caption badge
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.fillRect(BOARD_X + 10, BOARD_Y + 10, BOARD_W - 20, 24);
                ctx.strokeStyle = profileAccent;
                ctx.lineWidth = 1;
                ctx.strokeRect(BOARD_X + 10, BOARD_Y + 10, BOARD_W - 20, 24);

                ctx.font = 'bold 10px monospace';
                ctx.fillStyle = profileAccent;
                ctx.textAlign = 'center';
                ctx.fillText(`✨ ${s.holoFlash.memory.memory.title.toUpperCase()}`, BOARD_X + BOARD_W / 2, BOARD_Y + 26);
                ctx.restore();
            }

            // Playfield Grid Background Grid Lines
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cx = BOARD_X + c * CELL_SIZE;
                    const cy = BOARD_Y + r * CELL_SIZE;

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);
                }
            }

            // Render Solid Blocks with smooth sub-pixel descent
            const yOffset = s.gameState === 'playing' ? s.descendVisualOffset : 0;

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const val = s.grid[r][c];
                    if (val !== 0) {
                        const cx = BOARD_X + c * CELL_SIZE;
                        const cy = BOARD_Y + r * CELL_SIZE + yOffset;

                        // Only render within board bounds
                        if (cy + CELL_SIZE >= BOARD_Y && cy <= BOARD_Y + BOARD_H) {
                            const colHex = BLOCK_COLORS[(val - 1 + BLOCK_COLORS.length) % BLOCK_COLORS.length] || '#00f0ff';
                            ctx.fillStyle = colHex;
                            ctx.shadowColor = colHex;
                            ctx.shadowBlur = 8;
                            ctx.fillRect(cx + 1.5, cy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);

                            // Top-left highlight bevel
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                            ctx.fillRect(cx + 3, cy + 3, CELL_SIZE - 6, 3);
                            ctx.fillRect(cx + 3, cy + 3, 3, CELL_SIZE - 6);

                            // Dark border
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(cx + 1.5, cy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
                        }
                    }
                }
            }
            ctx.shadowBlur = 0;

            // Targeting Ghost Guide Line & Ghost Landing Slot
            if (s.gameState === 'playing') {
                const targetCol = s.playerCol;
                const tX = BOARD_X + targetCol * CELL_SIZE;

                // Find lowest block in targetCol
                let targetRow = 0;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (s.grid[r][targetCol] !== 0) {
                        targetRow = r + 1;
                        break;
                    }
                }

                const ghostY = BOARD_Y + targetRow * CELL_SIZE + yOffset;

                // Laser Targeting Beam
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(tX + CELL_SIZE / 2, DANGER_Y + 10);
                ctx.lineTo(tX + CELL_SIZE / 2, ghostY + CELL_SIZE / 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Ghost block landing slot preview
                if (targetRow < DANGER_ROW) {
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(tX + 3, ghostY + 3, CELL_SIZE - 6, CELL_SIZE - 6);
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
                    ctx.fillRect(tX + 3, ghostY + 3, CELL_SIZE - 6, CELL_SIZE - 6);
                    ctx.shadowBlur = 0;
                }
            }

            // Clearing Rectangles Flash Effect
            s.clearingRects.forEach(cr => {
                ctx.save();
                const progress = cr.timer / cr.maxTimer;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3 + (1 - progress) * 4;
                ctx.shadowColor = cr.color;
                ctx.shadowBlur = 24;
                ctx.fillStyle = `rgba(255, 255, 255, ${progress * 0.5})`;

                const rx = BOARD_X + cr.c1 * CELL_SIZE;
                const ry = BOARD_Y + cr.r1 * CELL_SIZE + yOffset;
                const rw = (cr.c2 - cr.c1 + 1) * CELL_SIZE;
                const rh = (cr.r2 - cr.r1 + 1) * CELL_SIZE;

                ctx.fillRect(rx, ry, rw, rh);
                ctx.strokeRect(rx, ry, rw, rh);
                ctx.restore();
            });

            // Danger Zone Warning Background
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(BOARD_X, DANGER_Y, BOARD_W, BOARD_H - (DANGER_Y - BOARD_Y));

            // Red Danger Line with Pulsing Glow
            const dangerPulse = (Math.sin(time / 200) + 1) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(239, 68, 68, ${dangerPulse})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(BOARD_X, DANGER_Y);
            ctx.lineTo(BOARD_X + BOARD_W, DANGER_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Danger Row Warning Text
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText('▲ LÍNEA DE PELIGRO ▲', BOARD_X + 8, DANGER_Y - 5);

            // Border Outline
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(BOARD_X - 1.5, BOARD_Y - 1.5, BOARD_W + 3, BOARD_H + 3);

            // Player Shooter Ship
            const px = s.playerVisualX;
            ctx.save();
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 14;

            // Ship Body
            ctx.beginPath();
            ctx.moveTo(px, DANGER_Y + 12);
            ctx.lineTo(px - 15, DANGER_Y + 34);
            ctx.lineTo(px - 5, DANGER_Y + 30);
            ctx.lineTo(px, DANGER_Y + 35);
            ctx.lineTo(px + 5, DANGER_Y + 30);
            ctx.lineTo(px + 15, DANGER_Y + 34);
            ctx.closePath();
            ctx.fill();

            // Cannon Core Glow
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 8;
            ctx.fillRect(px - 3.5, DANGER_Y + 8, 7, 7);
            ctx.restore();

            // Block Projectiles in Flight
            s.projectiles.forEach(p => {
                ctx.save();
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 12;
                ctx.fillRect(p.x - 14, p.y - 14, 28, 28);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
                ctx.restore();
            });

            // Particles
            s.particles.forEach(pt => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 8;
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
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Scanline Filter
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
    }, [crtEnabled, checkQuarthRectangles, spawnPatternAtCeiling, profileAccent]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            stateRef.current.keysHeld.add(e.key);
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                movePlayer(-1);
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                movePlayer(1);
            }
            if (e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                shootBlock();
            }
            if (e.key === 'b' || e.key === 'B' || e.key === 'k' || e.key === 'K') {
                fireLaserBomb();
            }
            if (e.key === 'Enter') {
                if (stateRef.current.gameState !== 'playing') startNewGame();
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
    }, [fireLaserBomb, movePlayer, shootBlock, startNewGame]);

    // Canvas Pointer Move & Drag (Smooth Touch Tracking)
    const updatePlayerPositionFromClientX = (clientX: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = V_WIDTH / rect.width;
        const canvasX = (clientX - rect.left) * scaleX;

        const col = Math.max(0, Math.min(COLS - 1, Math.floor((canvasX - BOARD_X) / CELL_SIZE)));
        stateRef.current.playerCol = col;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        stateRef.current.isDragging = true;
        updatePlayerPositionFromClientX(e.clientX);
        if (stateRef.current.gameState === 'playing') {
            shootBlock();
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (stateRef.current.isDragging) {
            updatePlayerPositionFromClientX(e.clientX);
        }
    };

    const handlePointerUp = () => {
        stateRef.current.isDragging = false;
    };

    return (
        <div
            ref={containerRef}
            className="relative h-[76vh] max-h-[820px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 h-full w-full block object-contain select-none cursor-crosshair touch-none"
            />

            {/* Top HUD */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                    {/* Score */}
                    <div className="bg-black/85 border border-cyan-500/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-[0_0_12px_rgba(0,240,255,0.3)] pointer-events-auto">
                        <div className="text-[7px] sm:text-[8px] uppercase tracking-widest text-cyan-400 font-bold">SCORE</div>
                        <div className="text-sm sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    {/* High Score */}
                    <div className="bg-black/85 border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg pointer-events-auto flex items-center gap-1.5">
                        <div>
                            <div className="text-[7px] sm:text-[8px] uppercase tracking-widest text-white/50 font-bold flex items-center gap-1">
                                <Trophy className="w-2.5 h-2.5 text-amber-400" /> HIGH
                            </div>
                            <div className="text-sm sm:text-lg font-black text-amber-400 tabular-nums">{highScore}</div>
                        </div>
                    </div>
                    {/* Stage */}
                    <div className="bg-black/85 border border-pink-500/40 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[7px] sm:text-[8px] uppercase tracking-widest text-pink-400 font-bold">STAGE</div>
                        <div className="text-sm sm:text-lg font-black text-white tabular-nums">{stage}</div>
                    </div>
                    {/* Bombs */}
                    <div className="bg-black/85 border border-purple-500/40 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg pointer-events-auto flex items-center gap-1">
                        <div>
                            <div className="text-[7px] sm:text-[8px] uppercase tracking-widest text-purple-400 font-bold">BOMBS</div>
                            <div className="text-sm sm:text-lg font-black text-purple-300 tabular-nums">{laserBombs} 💣</div>
                        </div>
                    </div>
                    {/* Combo Indicator */}
                    {combo > 1 && (
                        <div className="bg-amber-500/20 border border-amber-400/60 px-2 py-1 rounded-lg animate-pulse pointer-events-auto">
                            <div className="text-[7px] uppercase tracking-widest text-amber-400 font-black">COMBO</div>
                            <div className="text-xs sm:text-sm font-black text-amber-300">x{combo} 🔥</div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-1.5 sm:p-2 border rounded-lg transition-all ${crtEnabled ? 'border-cyan-400 text-cyan-400 bg-cyan-950/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-1.5 sm:p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-black/80 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <button
                        onClick={() => movePlayer(-1)}
                        className="p-3.5 bg-white/10 active:bg-cyan-500 active:text-black rounded-xl text-white font-bold transition-transform active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => movePlayer(1)}
                        className="p-3.5 bg-white/10 active:bg-cyan-500 active:text-black rounded-xl text-white font-bold transition-transform active:scale-95"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Laser Bomb Button */}
                    <button
                        onClick={fireLaserBomb}
                        className="p-3.5 bg-purple-600 active:bg-purple-400 rounded-2xl text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1 transition-transform active:scale-95"
                    >
                        <Bomb className="w-5 h-5" />
                        <span className="text-xs font-mono font-black">{laserBombs}</span>
                    </button>

                    {/* Shoot Button */}
                    <button
                        onClick={shootBlock}
                        className="p-3.5 px-5 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center gap-1.5"
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
                        <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 MATRIX BREACH' : 'SUPPLEMENT SHOOTER 🧩'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Los bloques cruzaron la línea de peligro. Destruiste ${blocksCleared} bloques con un puntaje de ${score}.`
                                : 'Dispara bloques para rellenar los huecos en las figuras descendentes. Al completar un rectángulo perfecto y cerrado (sin bordes sueltos), se detona y activa transmisiones holográficas.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-black uppercase text-sm sm:text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2"
                        >
                            {gameState === 'gameover' ? (
                                <>
                                    <RotateCcw className="w-5 h-5" />
                                    <span>REINTENTAR MATRIZ</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>INICIAR PARTIDA</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
