'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TetrisAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, RotateCw, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Shield, Tv, Sparkles, Trophy, Crown } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';

interface TetrisMatrixProps {
    accentColor?: string;
}

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30; // 300 x 600 playfield
const V_WIDTH = 680;
const V_HEIGHT = 740;
const BOARD_X = (V_WIDTH - COLS * CELL_SIZE) / 2; // 190
const BOARD_Y = 70;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface Piece {
    type: TetrominoType;
    rot: number; // 0, 1, 2, 3
    x: number;
    y: number;
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

const TETROMINO_COLORS: Record<TetrominoType, string> = {
    I: '#00f0ff', // Cyan
    J: '#3b82f6', // Blue
    L: '#f59e0b', // Amber
    O: '#facc15', // Yellow
    S: '#22c55e', // Green
    T: '#a855f7', // Purple
    Z: '#ef4444', // Red
};

function getPieceOffsets(type: TetrominoType, rot: number): [number, number][] {
    const r = ((rot % 4) + 4) % 4;
    switch (type) {
        case 'I':
            if (r === 0) return [[0, 1], [1, 1], [2, 1], [3, 1]];
            if (r === 1) return [[2, 0], [2, 1], [2, 2], [2, 3]];
            if (r === 2) return [[0, 2], [1, 2], [2, 2], [3, 2]];
            return [[1, 0], [1, 1], [1, 2], [1, 3]];
        case 'J':
            if (r === 0) return [[0, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [2, 0], [1, 1], [1, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [2, 2]];
            return [[1, 0], [1, 1], [0, 2], [1, 2]];
        case 'L':
            if (r === 0) return [[2, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [1, 1], [1, 2], [2, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [0, 2]];
            return [[0, 0], [1, 0], [1, 1], [1, 2]];
        case 'O':
            return [[1, 0], [2, 0], [1, 1], [2, 1]];
        case 'S':
            if (r === 0 || r === 2) return [[1, 0], [2, 0], [0, 1], [1, 1]];
            return [[1, 0], [1, 1], [2, 1], [2, 2]];
        case 'T':
            if (r === 0) return [[1, 0], [0, 1], [1, 1], [2, 1]];
            if (r === 1) return [[1, 0], [1, 1], [2, 1], [1, 2]];
            if (r === 2) return [[0, 1], [1, 1], [2, 1], [1, 2]];
            return [[1, 0], [0, 1], [1, 1], [1, 2]];
        case 'Z':
            if (r === 0 || r === 2) return [[0, 0], [1, 0], [1, 1], [2, 1]];
            return [[2, 0], [1, 1], [2, 1], [1, 2]];
    }
}

export function TetrisMatrixCanvas({ accentColor = '#00f0ff' }: TetrisMatrixProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();

    const elBest = scores['tetrismatrix']?.el || 0;
    const ellaBest = scores['tetrismatrix']?.ella || 0;

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
    const [nextPieces, setNextPieces] = useState<TetrominoType[]>([]);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    const stateRef = useRef({
        grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null as TetrominoType | null)),
        current: null as Piece | null,
        hold: null as TetrominoType | null,
        canHold: true,
        bag: [] as TetrominoType[],
        score: 0,
        highScore: 0,
        lines: 0,
        level: 1,
        combo: 0,
        fallTimer: 0,
        fallInterval: 0.8,
        lockTimer: 0,
        isLocking: false,
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover',
        touchStart: null as { x: number; y: number } | null,
    });

    const handleGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'gameover';
        setGameState('gameover');
        TetrisAudio.gameOver();

        const res = recordScore('tetrismatrix', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const activePb = profile === 'ella' ? ellaBest : elBest;
        setHighScore(activePb);
        stateRef.current.highScore = activePb;
    }, [profile, elBest, ellaBest]);

    const fillBag = useCallback(() => {
        const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        stateRef.current.bag.push(...types);
    }, []);

    const spawnNextPiece = useCallback(() => {
        const s = stateRef.current;
        if (s.bag.length < 7) {
            fillBag();
        }

        const next = s.bag.shift()!;
        s.current = {
            type: next,
            rot: 0,
            x: 3,
            y: 0,
        };
        s.canHold = true;
        s.isLocking = false;
        s.lockTimer = 0;

        setNextPieces([...s.bag.slice(0, 3)]);

        // Check if top-out
        const offsets = getPieceOffsets(s.current.type, s.current.rot);
        for (const [ox, oy] of offsets) {
            if (s.grid[s.current.y + oy]?.[s.current.x + ox] !== null) {
                handleGameOver();
                break;
            }
        }
    }, [fillBag, handleGameOver]);

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('tetris_matrix_highscore');
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

    const addShake = (intensity = 8, dur = 0.2) => {
        const s = stateRef.current;
        s.shakeIntensity = intensity;
        s.shakeTime = dur;
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#facc15') => {
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.8 });
    };

    const isValidPos = (piece: Piece): boolean => {
        const s = stateRef.current;
        const offsets = getPieceOffsets(piece.type, piece.rot);
        for (const [ox, oy] of offsets) {
            const gx = piece.x + ox;
            const gy = piece.y + oy;
            if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return false;
            if (s.grid[gy][gx] !== null) return false;
        }
        return true;
    };

    const getGhostY = (): number => {
        const s = stateRef.current;
        if (!s.current) return 0;
        let testY = s.current.y;
        while (isValidPos({ ...s.current, y: testY + 1 })) {
            testY++;
        }
        return testY;
    };

    const spawnParticles = (x: number, y: number, color: string, count = 16, speed = 160) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random() * 0.7);
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

    const lockCurrentPiece = useCallback(() => {
        const s = stateRef.current;
        if (!s.current) return;

        const offsets = getPieceOffsets(s.current.type, s.current.rot);
        for (const [ox, oy] of offsets) {
            const gx = s.current.x + ox;
            const gy = s.current.y + oy;
            if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
                s.grid[gy][gx] = s.current.type;
            }
        }

        // Check line clears
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (s.grid[r].every(cell => cell !== null)) {
                cleared++;
                // Line explosion particles
                for (let c = 0; c < COLS; c++) {
                    const cellType = (s.grid[r][c] || 'I') as TetrominoType;
                    spawnParticles(
                        BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
                        BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2,
                        TETROMINO_COLORS[cellType],
                        6,
                        200
                    );
                }

                // Drop rows
                for (let downR = r; downR > 0; downR--) {
                    s.grid[downR] = [...s.grid[downR - 1]];
                }
                s.grid[0] = Array(COLS).fill(null);
                r++; // Re-evaluate current row
            }
        }

        if (cleared > 0) {
            s.lines += cleared;
            setLines(s.lines);
            s.combo++;

            TetrisAudio.clear(cleared);
            const basePts = [0, 100, 300, 500, 800];
            const pts = basePts[cleared] * s.level + (s.combo > 1 ? s.combo * 50 * s.level : 0);
            s.score += pts;
            setScore(s.score);

            if (cleared === 4) {
                addShake(12, 0.35);
                addFloatingText(BOARD_X + (COLS * CELL_SIZE) / 2, BOARD_Y + 120, '🔥 TETRIS! +800', '#00f0ff');
            } else if (cleared >= 2) {
                addFloatingText(BOARD_X + (COLS * CELL_SIZE) / 2, BOARD_Y + 140, `COMBO x${cleared}! +${pts}`, '#facc15');
            }

            if (s.lines >= s.level * 10) {
                s.level++;
                setLevel(s.level);
                s.fallInterval = Math.max(0.1, 0.8 - (s.level - 1) * 0.07);
                TetrisAudio.levelUp();
                addFloatingText(BOARD_X + (COLS * CELL_SIZE) / 2, BOARD_Y + 80, `LEVEL UP! LEVEL ${s.level}`, '#a855f7');
            }

            if (s.score > s.highScore) {
                s.highScore = s.score;
                setHighScore(s.score);
                localStorage.setItem('tetris_matrix_highscore', s.score.toString());
            }
        } else {
            s.combo = 0;
        }

        spawnNextPiece();
    }, [spawnNextPiece]);

    const moveHorizontal = useCallback((dx: number) => {
        const s = stateRef.current;
        if (!s.current || s.gameState !== 'playing') return;
        const test = { ...s.current, x: s.current.x + dx };
        if (isValidPos(test)) {
            s.current = test;
            TetrisAudio.move();
            if (s.isLocking) s.lockTimer = 0;
        }
    }, []);

    const rotatePiece = useCallback((dir: number) => {
        const s = stateRef.current;
        if (!s.current || s.gameState !== 'playing') return;
        const test = { ...s.current, rot: s.current.rot + dir };

        // Wall kick checks
        const kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1]];
        for (const [kx, ky] of kicks) {
            const kicked = { ...test, x: test.x + kx, y: test.y + ky };
            if (isValidPos(kicked)) {
                s.current = kicked;
                TetrisAudio.rotate();
                if (s.isLocking) s.lockTimer = 0;
                return;
            }
        }
    }, []);

    const hardDrop = useCallback(() => {
        const s = stateRef.current;
        if (!s.current || s.gameState !== 'playing') return;
        const ghostY = getGhostY();
        const droppedRows = ghostY - s.current.y;
        s.score += droppedRows * 2;
        setScore(s.score);
        s.current.y = ghostY;

        TetrisAudio.drop();
        addShake(6, 0.18);

        // Impact spark particles
        const offsets = getPieceOffsets(s.current.type, s.current.rot);
        for (const [ox, oy] of offsets) {
            spawnParticles(
                BOARD_X + (s.current.x + ox) * CELL_SIZE + CELL_SIZE / 2,
                BOARD_Y + (s.current.y + oy) * CELL_SIZE + CELL_SIZE / 2,
                TETROMINO_COLORS[s.current.type],
                8,
                140
            );
        }

        lockCurrentPiece();
    }, [lockCurrentPiece]);

    const holdCurrentPiece = useCallback(() => {
        const s = stateRef.current;
        if (!s.current || !s.canHold || s.gameState !== 'playing') return;
        s.canHold = false;
        TetrisAudio.hold();

        const curType = s.current.type;
        if (s.hold === null) {
            s.hold = curType;
            setHoldPiece(curType);
            spawnNextPiece();
        } else {
            const swap = s.hold;
            s.hold = curType;
            setHoldPiece(curType);
            s.current = {
                type: swap,
                rot: 0,
                x: 3,
                y: 0,
            };
            s.isLocking = false;
            s.lockTimer = 0;
        }
    }, [spawnNextPiece]);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        s.score = 0;
        s.lines = 0;
        s.level = 1;
        s.combo = 0;
        s.fallInterval = 0.8;
        s.fallTimer = 0;
        s.lockTimer = 0;
        s.isLocking = false;
        s.hold = null;
        s.canHold = true;
        s.bag = [];
        s.particles = [];
        s.floatingTexts = [];
        s.gameState = 'playing';

        setScore(0);
        setLines(0);
        setLevel(1);
        setHoldPiece(null);
        setGameState('playing');

        fillBag();
        fillBag();
        spawnNextPiece();
        TetrisAudio.levelUp();
    }, [fillBag, spawnNextPiece]);

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

            // Screen shake update
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

            // Gravity & Fall Logic
            if (s.gameState === 'playing' && s.current) {
                s.fallTimer += dt;
                if (s.fallTimer >= s.fallInterval) {
                    s.fallTimer = 0;
                    if (isValidPos({ ...s.current, y: s.current.y + 1 })) {
                        s.current.y++;
                        s.isLocking = false;
                        s.lockTimer = 0;
                    } else {
                        s.isLocking = true;
                    }
                }

                if (s.isLocking) {
                    s.lockTimer += dt;
                    if (s.lockTimer >= 0.5) {
                        lockCurrentPiece();
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

            // Dark Matrix Background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#050711');
            bgGrad.addColorStop(1, '#0c1024');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Grid Playfield Background
            ctx.fillStyle = '#060914';
            ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL_SIZE, ROWS * CELL_SIZE);

            // Grid Matrix Cells
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cx = BOARD_X + c * CELL_SIZE;
                    const cy = BOARD_Y + r * CELL_SIZE;

                    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);

                    const cell = s.grid[r][c] as TetrominoType | null;
                    if (cell) {
                        ctx.fillStyle = TETROMINO_COLORS[cell];
                        ctx.shadowColor = TETROMINO_COLORS[cell];
                        ctx.shadowBlur = 10;
                        ctx.fillRect(cx + 1.5, cy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);

                        // Highlight bevel
                        ctx.fillStyle = 'rgba(255,255,255,0.4)';
                        ctx.fillRect(cx + 2, cy + 2, CELL_SIZE - 4, 3);
                    }
                }
            }
            ctx.shadowBlur = 0;

            // Glowing Matrix Border
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.strokeRect(BOARD_X - 1.5, BOARD_Y - 1.5, COLS * CELL_SIZE + 3, ROWS * CELL_SIZE + 3);
            ctx.shadowBlur = 0;

            // Ghost Piece
            if (s.gameState === 'playing' && s.current) {
                const ghostY = getGhostY();
                const offsets = getPieceOffsets(s.current.type, s.current.rot);
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1.5;

                for (const [ox, oy] of offsets) {
                    const gx = BOARD_X + (s.current.x + ox) * CELL_SIZE;
                    const gy = BOARD_Y + (ghostY + oy) * CELL_SIZE;
                    ctx.fillRect(gx + 1.5, gy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
                    ctx.strokeRect(gx + 1.5, gy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
                }

                // Active Piece
                const col = TETROMINO_COLORS[s.current.type];
                ctx.fillStyle = col;
                ctx.shadowColor = col;
                ctx.shadowBlur = 14;

                for (const [ox, oy] of offsets) {
                    const gx = BOARD_X + (s.current.x + ox) * CELL_SIZE;
                    const gy = BOARD_Y + (s.current.y + oy) * CELL_SIZE;
                    ctx.fillRect(gx + 1.5, gy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);

                    // Bevel highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.fillRect(gx + 2, gy + 2, CELL_SIZE - 4, 3);
                    ctx.fillStyle = col;
                }
                ctx.shadowBlur = 0;
            }

            // Left Panel: HOLD
            ctx.fillStyle = '#080d20';
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 2;
            ctx.fillRect(BOARD_X - 150, BOARD_Y + 10, 120, 100);
            ctx.strokeRect(BOARD_X - 150, BOARD_Y + 10, 120, 100);

            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('HOLD (C)', BOARD_X - 140, BOARD_Y + 30);

            if (s.hold) {
                const offsets = getPieceOffsets(s.hold, 0);
                ctx.fillStyle = TETROMINO_COLORS[s.hold];
                ctx.shadowColor = TETROMINO_COLORS[s.hold];
                ctx.shadowBlur = 8;
                for (const [ox, oy] of offsets) {
                    ctx.fillRect(BOARD_X - 130 + ox * 18, BOARD_Y + 45 + oy * 18, 16, 16);
                }
                ctx.shadowBlur = 0;
            }

            // Right Panel: NEXT
            const rightX = BOARD_X + COLS * CELL_SIZE + 30;
            ctx.fillStyle = '#080d20';
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(rightX, BOARD_Y + 10, 120, 220);
            ctx.strokeRect(rightX, BOARD_Y + 10, 120, 220);

            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('NEXT QUEUE', rightX + 12, BOARD_Y + 30);

            s.bag.slice(0, 3).forEach((nextT, idx) => {
                const offsets = getPieceOffsets(nextT, 0);
                ctx.fillStyle = TETROMINO_COLORS[nextT];
                ctx.shadowColor = TETROMINO_COLORS[nextT];
                ctx.shadowBlur = 8;
                for (const [ox, oy] of offsets) {
                    ctx.fillRect(rightX + 25 + ox * 16, BOARD_Y + 50 + idx * 60 + oy * 16, 14, 14);
                }
                ctx.shadowBlur = 0;
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

            // Floating Text
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Scanlines
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
    }, [crtEnabled, lockCurrentPiece]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveHorizontal(-1);
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveHorizontal(1);
            if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X' || e.key === 'w' || e.key === 'W') rotatePiece(1);
            if (e.key === 'z' || e.key === 'Z') rotatePiece(-1);
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                const s = stateRef.current;
                if (s.current && isValidPos({ ...s.current, y: s.current.y + 1 })) {
                    s.current.y++;
                    s.score += 1;
                    setScore(s.score);
                    TetrisAudio.move();
                }
            }
            if (e.key === ' ') hardDrop();
            if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') holdCurrentPiece();
            if (e.key === 'Enter') {
                if (stateRef.current.gameState !== 'playing') startNewGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveHorizontal, rotatePiece, hardDrop, holdCurrentPiece, startNewGame]);

    // Touch Swipe Controls
    const handleTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        stateRef.current.touchStart = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const s = stateRef.current;
        if (!s.touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.touchStart.x;
        const dy = t.clientY - s.touchStart.y;
        s.touchStart = null;

        if (Math.hypot(dx, dy) < 18) {
            rotatePiece(1);
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 25) moveHorizontal(1);
            else if (dx < -25) moveHorizontal(-1);
        } else {
            if (dy > 30) hardDrop();
            else if (dy < -25) holdCurrentPiece();
        }
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
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
                    <div className="bg-black/85 border border-purple-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-purple-400 font-bold">LEVEL</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{level}</div>
                    </div>
                    <div className="bg-black/85 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">LINES</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{lines}</div>
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

            {/* Mobile Touch Action Buttons (Only on small screens) */}
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/70 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <button
                        onClick={() => moveHorizontal(-1)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => moveHorizontal(1)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={holdCurrentPiece}
                        className="px-3 py-3 bg-white/10 active:bg-purple-500 rounded-xl text-white font-bold text-xs"
                    >
                        HOLD
                    </button>
                </div>

                <div className="flex items-center gap-1.5 bg-black/70 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <button
                        onClick={() => rotatePiece(1)}
                        className="p-3 bg-white/10 active:bg-amber-500 rounded-xl text-white font-bold"
                    >
                        <RotateCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={hardDrop}
                        className="p-3 bg-cyan-500 active:bg-cyan-400 text-black rounded-xl font-bold"
                    >
                        <ArrowDown className="w-5 h-5 font-black" />
                    </button>
                </div>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Guideline Arcade</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 MATRIX OVERFLOW' : 'TETRIS MATRIX 🧱'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has completado ${lines} líneas y alcanzado el nivel ${level} con ${score} puntos.`
                                : 'Reglas oficiales de 7-Bag, rotación SRS con wall kicks, guardado de pieza (Hold), pieza fantasma y tetris cuádruple.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'REINICIAR PARTIDA 🔄' : 'INICIAR MATRIX 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
