'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FroggerAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, RotateCcw, Tv, Trophy, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Heart } from 'lucide-react';

interface CyberFroggerProps {
    accentColor?: string;
}

const GRID_COLS = 15;
const GRID_ROWS = 13;
const CELL_SIZE = 42;
const BOARD_W = GRID_COLS * CELL_SIZE; // 630
const BOARD_H = GRID_ROWS * CELL_SIZE; // 546
const V_WIDTH = 670;
const V_HEIGHT = 740;
const BOARD_X = (V_WIDTH - BOARD_W) / 2; // 20
const BOARD_Y = 65;

const HOME_COLS = [1, 4, 7, 10, 13];

type ObstacleType = 'car' | 'truck' | 'racer' | 'logSmall' | 'logMed' | 'logLarge' | 'turtles';

interface Obstacle {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    row: number;
    type: ObstacleType;
    color: string;
    isWaterRide: boolean;
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

export function CyberFroggerCanvas({ accentColor = '#00f0ff' }: CyberFroggerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [stage, setStage] = useState(1);
    const [lives, setLives] = useState(3);
    const [timeRemaining, setTimeRemaining] = useState(45);
    const [homesFilled, setHomesFilled] = useState<boolean[]>([false, false, false, false, false]);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        playerCol: 7,
        playerRow: 12,
        playerVisualX: BOARD_X + 7.5 * CELL_SIZE,
        playerVisualY: BOARD_Y + 12.5 * CELL_SIZE,
        hopProgress: 1.0,
        score: 0,
        highScore: 0,
        stage: 1,
        lives: 3,
        timeRemaining: 45,
        homesFilled: [false, false, false, false, false],
        flyBayIndex: -1,
        flyTimer: 6.0,
        obstacles: [] as Obstacle[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'ready' as 'ready' | 'playing' | 'gameover',
        touchStart: null as { x: number; y: number } | null,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('cyber_frogger_highscore');
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

    const setupStage = useCallback((stageNum: number) => {
        const s = stateRef.current;
        s.playerCol = 7;
        s.playerRow = 12;
        s.playerVisualX = BOARD_X + 7.5 * CELL_SIZE;
        s.playerVisualY = BOARD_Y + 12.5 * CELL_SIZE;
        s.timeRemaining = 45;
        s.obstacles = [];
        s.particles = [];
        s.flyBayIndex = -1;
        s.flyTimer = 6.0;

        setTimeRemaining(45);
        setStage(stageNum);

        const spdMult = 1.0 + (stageNum - 1) * 0.15;

        // ── Road Obstacles (Rows 7 - 11) ────────────────────────────────────
        // Row 11: Sedans (Right ->)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 220,
                y: BOARD_Y + 11 * CELL_SIZE + 5,
                w: 52,
                h: 32,
                speed: 70 * spdMult,
                row: 11,
                type: 'car',
                color: '#f59e0b',
                isWaterRide: false,
            });
        }
        // Row 10: Fast Racers (Left <-)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 240,
                y: BOARD_Y + 10 * CELL_SIZE + 5,
                w: 48,
                h: 32,
                speed: -130 * spdMult,
                row: 10,
                type: 'racer',
                color: '#ec4899',
                isWaterRide: false,
            });
        }
        // Row 9: Bulldozers (Right ->)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 210,
                y: BOARD_Y + 9 * CELL_SIZE + 5,
                w: 56,
                h: 32,
                speed: 85 * spdMult,
                row: 9,
                type: 'car',
                color: '#22c55e',
                isWaterRide: false,
            });
        }
        // Row 8: Speedy Racers (Left <-)
        for (let i = 0; i < 2; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 320,
                y: BOARD_Y + 8 * CELL_SIZE + 5,
                w: 50,
                h: 32,
                speed: -160 * spdMult,
                row: 8,
                type: 'racer',
                color: '#00f0ff',
                isWaterRide: false,
            });
        }
        // Row 7: Freight Trucks (Right ->)
        for (let i = 0; i < 2; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 340,
                y: BOARD_Y + 7 * CELL_SIZE + 5,
                w: 94,
                h: 32,
                speed: 65 * spdMult,
                row: 7,
                type: 'truck',
                color: '#60a5fa',
                isWaterRide: false,
            });
        }

        // ── River Logs & Turtles (Rows 1 - 5) ───────────────────────────────
        // Row 5: Medium Logs (Right ->)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 240,
                y: BOARD_Y + 5 * CELL_SIZE + 4,
                w: 110,
                h: 34,
                speed: 80 * spdMult,
                row: 5,
                type: 'logMed',
                color: '#92400e',
                isWaterRide: true,
            });
        }
        // Row 4: Turtles (Left <-)
        for (let i = 0; i < 4; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 190,
                y: BOARD_Y + 4 * CELL_SIZE + 4,
                w: 80,
                h: 34,
                speed: -90 * spdMult,
                row: 4,
                type: 'turtles',
                color: '#10b981',
                isWaterRide: true,
            });
        }
        // Row 3: Large Logs (Right ->)
        for (let i = 0; i < 2; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 360,
                y: BOARD_Y + 3 * CELL_SIZE + 4,
                w: 170,
                h: 34,
                speed: 110 * spdMult,
                row: 3,
                type: 'logLarge',
                color: '#92400e',
                isWaterRide: true,
            });
        }
        // Row 2: Small Logs (Right ->)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 220,
                y: BOARD_Y + 2 * CELL_SIZE + 4,
                w: 85,
                h: 34,
                speed: 65 * spdMult,
                row: 2,
                type: 'logSmall',
                color: '#92400e',
                isWaterRide: true,
            });
        }
        // Row 1: Turtles (Left <-)
        for (let i = 0; i < 3; i++) {
            s.obstacles.push({
                id: Math.random(),
                x: BOARD_X + i * 230,
                y: BOARD_Y + 1 * CELL_SIZE + 4,
                w: 95,
                h: 34,
                speed: -100 * spdMult,
                row: 1,
                type: 'turtles',
                color: '#10b981',
                isWaterRide: true,
            });
        }
    }, []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.score = 0;
        s.lives = 3;
        s.stage = 1;
        s.homesFilled = [false, false, false, false, false];
        s.gameState = 'playing';

        setScore(0);
        setLives(3);
        setHomesFilled([false, false, false, false, false]);
        setGameState('playing');

        setupStage(1);
        FroggerAudio.stageClear();
    }, [setupStage]);

    const killPlayer = (reason: 'water' | 'car' | 'timeout' | 'miss') => {
        const s = stateRef.current;
        const px = s.playerVisualX;
        const py = s.playerVisualY;

        if (reason === 'water') {
            FroggerAudio.splash();
            spawnParticles(px, py, '#00f0ff', 35, 180);
            addFloatingText(px, py, 'SPLASH! 💦', '#00f0ff');
        } else {
            FroggerAudio.squash();
            spawnParticles(px, py, '#ef4444', 35, 220);
            addFloatingText(px, py, 'SPLAT! 💀', '#ef4444');
        }

        addShake(14, 0.35);
        s.lives--;
        setLives(s.lives);

        if (s.lives > 0) {
            s.playerCol = 7;
            s.playerRow = 12;
            s.playerVisualX = BOARD_X + 7.5 * CELL_SIZE;
            s.playerVisualY = BOARD_Y + 12.5 * CELL_SIZE;
            s.timeRemaining = 45;
            setTimeRemaining(45);
        } else {
            s.gameState = 'gameover';
            setGameState('gameover');
            FroggerAudio.gameOver();
        }
    };

    const movePlayer = useCallback((dx: number, dy: number) => {
        const s = stateRef.current;
        if (s.gameState !== 'playing') return;

        const targetCol = Math.max(0, Math.min(GRID_COLS - 1, s.playerCol + dx));
        const targetRow = Math.max(0, Math.min(GRID_ROWS - 1, s.playerRow + dy));

        if (targetRow < s.playerRow) {
            s.score += 10;
            setScore(s.score);
        }

        s.playerCol = targetCol;
        s.playerRow = targetRow;
        s.playerVisualX = BOARD_X + (s.playerCol + 0.5) * CELL_SIZE;
        s.playerVisualY = BOARD_Y + (s.playerRow + 0.5) * CELL_SIZE;

        FroggerAudio.hop();
        spawnParticles(s.playerVisualX, s.playerVisualY, '#22c55e', 6, 60);

        // Check Home Row (Row 0)
        if (s.playerRow === 0) {
            let landedHome = false;
            for (let i = 0; i < HOME_COLS.length; i++) {
                if (s.playerCol === HOME_COLS[i] && !s.homesFilled[i]) {
                    landedHome = true;
                    s.homesFilled[i] = true;
                    setHomesFilled([...s.homesFilled]);

                    const timeBonus = Math.floor(s.timeRemaining * 10);
                    s.score += 500 + timeBonus;
                    FroggerAudio.home();
                    addFloatingText(s.playerVisualX, s.playerVisualY, `+${500 + timeBonus} HOME! 🐸`, '#facc15');
                    spawnParticles(s.playerVisualX, s.playerVisualY, '#facc15', 25, 200);

                    if (s.flyBayIndex === i) {
                        s.score += 200;
                        FroggerAudio.fly();
                        addFloatingText(s.playerVisualX, s.playerVisualY - 20, '+200 FLY! 🪰', '#22c55e');
                        s.flyBayIndex = -1;
                    }
                    setScore(s.score);

                    // Check all 5 homes filled
                    if (s.homesFilled.every(f => f)) {
                        s.stage++;
                        s.score += 1000;
                        setScore(s.score);
                        s.homesFilled = [false, false, false, false, false];
                        setHomesFilled([false, false, false, false, false]);
                        FroggerAudio.stageClear();
                        addFloatingText(BOARD_X + BOARD_W / 2, BOARD_Y + 120, 'STAGE CLEAR! +1000 🎉', '#a855f7');
                        setupStage(s.stage);
                    } else {
                        s.playerCol = 7;
                        s.playerRow = 12;
                        s.playerVisualX = BOARD_X + 7.5 * CELL_SIZE;
                        s.playerVisualY = BOARD_Y + 12.5 * CELL_SIZE;
                        s.timeRemaining = 45;
                        setTimeRemaining(45);
                    }
                    break;
                }
            }

            if (!landedHome) {
                killPlayer('miss');
            }
        }
    }, [setupStage]);

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

            // Screen shake
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

            if (s.gameState === 'playing') {
                // Countdown timer
                s.timeRemaining -= dt;
                setTimeRemaining(Math.max(0, Math.ceil(s.timeRemaining)));
                if (s.timeRemaining <= 0) {
                    killPlayer('timeout');
                }

                // Fly timer
                s.flyTimer -= dt;
                if (s.flyTimer <= 0) {
                    s.flyTimer = 6.0 + Math.random() * 6.0;
                    s.flyBayIndex = Math.floor(Math.random() * 5);
                    if (s.homesFilled[s.flyBayIndex]) s.flyBayIndex = -1;
                }

                // Update Obstacles position
                const wrapLeft = BOARD_X - 180;
                const wrapRight = BOARD_X + BOARD_W + 180;

                for (const obs of s.obstacles) {
                    obs.x += obs.speed * dt;
                    if (obs.speed > 0 && obs.x > wrapRight) {
                        obs.x = wrapLeft - obs.w;
                    } else if (obs.speed < 0 && obs.x < wrapLeft - obs.w) {
                        obs.x = wrapRight;
                    }
                }

                // ── Collision Checks ──
                const frogX = s.playerVisualX;

                // 1. Road Vehicles (Rows 7 to 11)
                if (s.playerRow >= 7 && s.playerRow <= 11) {
                    for (const obs of s.obstacles) {
                        if (obs.row === s.playerRow) {
                            if (frogX >= obs.x - 12 && frogX <= obs.x + obs.w + 12) {
                                killPlayer('car');
                                break;
                            }
                        }
                    }
                }

                // 2. River Logs / Turtles (Rows 1 to 5)
                if (s.playerRow >= 1 && s.playerRow <= 5) {
                    let onRide = false;
                    let rideSpeed = 0;

                    for (const obs of s.obstacles) {
                        if (obs.row === s.playerRow && obs.isWaterRide) {
                            if (frogX >= obs.x - 8 && frogX <= obs.x + obs.w + 8) {
                                onRide = true;
                                rideSpeed = obs.speed;
                                break;
                            }
                        }
                    }

                    if (onRide) {
                        s.playerVisualX += rideSpeed * dt;
                        s.playerCol = Math.round((s.playerVisualX - BOARD_X) / CELL_SIZE - 0.5);

                        // Carried off screen
                        if (s.playerVisualX < BOARD_X - 12 || s.playerVisualX > BOARD_X + BOARD_W + 12) {
                            killPlayer('water');
                        }
                    } else {
                        killPlayer('water');
                    }
                }

                if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    localStorage.setItem('cyber_frogger_highscore', s.score.toString());
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

            // Dark Backdrop
            ctx.fillStyle = '#060814';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // River Water Area (Rows 0 to 5)
            const waterGrad = ctx.createLinearGradient(0, BOARD_Y, 0, BOARD_Y + 6 * CELL_SIZE);
            waterGrad.addColorStop(0, '#0c2340');
            waterGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, 6 * CELL_SIZE);

            // Water Ripple Lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let r = 1; r <= 5; r++) {
                const ry = BOARD_Y + r * CELL_SIZE;
                ctx.beginPath();
                ctx.moveTo(BOARD_X, ry);
                ctx.lineTo(BOARD_X + BOARD_W, ry);
                ctx.stroke();
            }

            // Median Island (Row 6)
            ctx.fillStyle = '#14532d';
            ctx.fillRect(BOARD_X, BOARD_Y + 6 * CELL_SIZE, BOARD_W, CELL_SIZE);

            // Highway Area (Rows 7 to 11)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(BOARD_X, BOARD_Y + 7 * CELL_SIZE, BOARD_W, 5 * CELL_SIZE);

            // Road Lane Dashes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash([12, 12]);
            for (let r = 8; r <= 11; r++) {
                const ry = BOARD_Y + r * CELL_SIZE;
                ctx.beginPath();
                ctx.moveTo(BOARD_X, ry);
                ctx.lineTo(BOARD_X + BOARD_W, ry);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // Starting Sidewalk (Row 12)
            ctx.fillStyle = '#14532d';
            ctx.fillRect(BOARD_X, BOARD_Y + 12 * CELL_SIZE, BOARD_W, CELL_SIZE);

            // Board Outline
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);

            // Destination Bays (Row 0)
            for (let i = 0; i < HOME_COLS.length; i++) {
                const bx = BOARD_X + HOME_COLS[i] * CELL_SIZE;
                const by = BOARD_Y;

                if (s.homesFilled[i]) {
                    ctx.fillStyle = '#22c55e';
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 10;
                    ctx.fillRect(bx + 4, by + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐸', bx + CELL_SIZE / 2, by + CELL_SIZE / 2);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = '#064e3b';
                    ctx.fillRect(bx + 4, by + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    if (s.flyBayIndex === i) {
                        ctx.fillStyle = '#facc15';
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 8;
                        ctx.font = 'bold 14px monospace';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🪰', bx + CELL_SIZE / 2, by + CELL_SIZE / 2);
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Render Obstacles (Cars, Trucks, Logs, Turtles)
            s.obstacles.forEach(obs => {
                ctx.save();
                if (obs.isWaterRide) {
                    if (obs.type === 'turtles') {
                        ctx.fillStyle = '#059669';
                        ctx.shadowColor = '#10b981';
                        ctx.shadowBlur = 6;
                        ctx.beginPath();
                        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 10);
                        ctx.fill();

                        ctx.fillStyle = '#34d399';
                        ctx.fillRect(obs.x + 6, obs.y + 6, obs.w - 12, obs.h - 12);
                    } else {
                        // Floating Logs
                        ctx.fillStyle = '#78350f';
                        ctx.shadowColor = '#92400e';
                        ctx.shadowBlur = 6;
                        ctx.beginPath();
                        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
                        ctx.fill();

                        ctx.fillStyle = '#b45309';
                        ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, 4);
                    }
                } else {
                    // Traffic Vehicles
                    ctx.fillStyle = obs.color;
                    ctx.shadowColor = obs.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
                    ctx.fill();

                    // Windshield
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(obs.x + obs.w * 0.25, obs.y + 4, obs.w * 0.5, obs.h - 8);
                }
                ctx.restore();
            });

            // Render Player Cyber Frog
            if (s.gameState !== 'gameover') {
                ctx.save();
                const fx = s.playerVisualX;
                const fy = s.playerVisualY;
                ctx.fillStyle = '#22c55e';
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(fx, fy, 13, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(fx - 6, fy - 6, 3, 0, Math.PI * 2);
                ctx.arc(fx + 6, fy - 6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

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
    }, [crtEnabled, killPlayer]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') movePlayer(0, -1);
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePlayer(0, 1);
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(-1, 0);
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1, 0);
            if (e.key === 'Enter' || e.key === ' ') {
                if (stateRef.current.gameState !== 'playing') startNewGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer, startNewGame]);

    // Touch Swipe Handlers
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
            movePlayer(0, -1); // Tap = hop forward
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 25) movePlayer(1, 0);
            else if (dx < -25) movePlayer(-1, 0);
        } else {
            if (dy > 25) movePlayer(0, 1);
            else if (dy < -25) movePlayer(0, -1);
        }
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
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
                    <div className="bg-black/85 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto flex items-center gap-1.5">
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">LIVES</div>
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: lives }).map((_, i) => (
                                <span key={i} className="text-xs">🐸</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">TIME</div>
                        <div className={`text-base sm:text-lg font-black tabular-nums ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {timeRemaining}s
                        </div>
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

            {/* Mobile Touch D-Pad */}
            <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="grid grid-cols-3 gap-1.5 bg-black/70 p-2 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
                    <div />
                    <button
                        onClick={() => movePlayer(0, -1)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                    <div />
                    <button
                        onClick={() => movePlayer(-1, 0)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => movePlayer(0, 1)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => movePlayer(1, 0)}
                        className="p-3 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ River & Road Crossing</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 OUT OF LIVES' : 'CYBER FROGGER 🐸'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has alcanzado la etapa ${stage} con ${score} puntos.`
                                : 'Calcula tus saltos para cruzar la concurrida autopista y el río sobre troncos y tortugas. ¡Llena las 5 bahías para ganar!'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                        >
                            {gameState === 'gameover' ? 'INTENTAR DE NUEVO 🔄' : 'COMENZAR CRUCE 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
