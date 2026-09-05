import { useState, useRef, useCallback, useEffect } from 'react';
import { TetrisAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';
import {
    TetrominoType, Piece, Particle, FloatingText,
    TETROMINO_COLORS, getPieceOffsets,
    COLS, ROWS, CELL_SIZE, BOARD_X, BOARD_Y
} from '@/components/arcade/tetrisConstants';

export function useTetrisLogic() {
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
    const [lastRecordResult,
        setLastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

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
    }, [recordScore, setLastRecordResult]);

    useEffect(() => {
                // eslint-disable-next-line react-hooks/set-state-in-effect
        setMutedState(loadMutedPreference());
        const activePb = profile === 'ella' ? ellaBest : elBest;
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                // eslint-disable-next-line react-hooks/set-state-in-effect
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('tetris_matrix_highscore');
        if (saved) {
            const val = parseInt(saved, 10);
            // eslint-disable-next-line react-hooks/set-state-in-effect
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


    return {
        lastRecordResult,
        setLastRecordResult,
        stateRef,
        score,
        highScore,
        lines,
        level,
        holdPiece,
        nextPieces,
        gameState,
        mutedState,
        crtEnabled,
        setCrtEnabled,
        toggleMute,
        startNewGame,
        moveHorizontal,
        rotatePiece,
        hardDrop,
        holdCurrentPiece,
        getGhostY,
        isValidPos,
        lockCurrentPiece
    };
}
