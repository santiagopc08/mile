'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ViperAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Sparkles, Trophy, RotateCcw, Tv, Zap, Crown } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useArcadePhotos, StylizedMemory } from '@/hooks/useArcadePhotos';
import { useProfile } from '@/context/ProfileContext';

interface CyberViperProps {
    accentColor?: string;
}

const COLS = 40;
const ROWS = 24;
const CELL_SIZE = 26;
const V_WIDTH = COLS * CELL_SIZE; // 1040
const V_HEIGHT = ROWS * CELL_SIZE; // 624

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type FoodType = 'standard' | 'golden' | 'speed' | 'multiplier';

interface CoupleSnack {
    name: string;
    emoji: string;
    type: FoodType;
    points: number;
    color: string;
}

const COUPLE_SNACKS: CoupleSnack[] = [
    { name: 'Sushi de Salmón', emoji: '🍣', type: 'standard', points: 100, color: '#ff7043' },
    { name: 'Matcha Latte', emoji: '🍵', type: 'standard', points: 120, color: '#4caf50' },
    { name: 'Boba Tea', emoji: '🧋', type: 'multiplier', points: 200, color: '#a855f7' },
    { name: 'Pizza de Pareja', emoji: '🍕', type: 'golden', points: 300, color: '#facc15' },
    { name: 'Fresas con Crema', emoji: '🍓', type: 'speed', points: 150, color: '#ec4899' },
    { name: 'Helado Artesanal', emoji: '🍦', type: 'standard', points: 110, color: '#38bdf8' },
    { name: 'Hamburguesa Smash', emoji: '🍔', type: 'golden', points: 350, color: '#f59e0b' },
    { name: 'Cafecito Especial', emoji: '☕', type: 'speed', points: 150, color: '#d97706' },
];

interface Segment {
    x: number;
    y: number;
}

interface Food {
    x: number;
    y: number;
    snack: CoupleSnack;
    pulse: number;
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

interface HoloFlash {
    memory: StylizedMemory;
    timer: number;
    maxTimer: number;
}

export function CyberViperCanvas({ accentColor = '#22c55e' }: CyberViperProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();
    const { stylizedMemories, accentColor: profileAccent } = useArcadePhotos(V_WIDTH, V_HEIGHT);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [boostActive, setBoostActive] = useState(false);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    const elBest = scores['cyberviper']?.el || 0;
    const ellaBest = scores['cyberviper']?.ella || 0;

    const stateRef = useRef({
        snake: [
            { x: 12, y: 12 },
            { x: 11, y: 12 },
            { x: 10, y: 12 },
            { x: 9, y: 12 },
        ] as Segment[],
        dir: 'RIGHT' as Direction,
        nextDir: 'RIGHT' as Direction,
        foods: [] as Food[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        holoFlash: null as HoloFlash | null,
        score: 0,
        highScore: 0,
        multiplier: 1,
        targetLength: 5,
        moveTimer: 0,
        moveInterval: 0.085,
        boostTimer: 0,
        combo: 0,
        snacksEaten: 0,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover',
        touchStart: null as { x: number; y: number } | null,
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

    const spawnFood = useCallback(() => {
        const s = stateRef.current;
        if (s.foods.length >= 3) return;

        for (let i = 0; i < 100; i++) {
            const rx = Math.floor(Math.random() * (COLS - 2)) + 1;
            const ry = Math.floor(Math.random() * (ROWS - 2)) + 1;

            const onSnake = s.snake.some(seg => seg.x === rx && seg.y === ry);
            const onFood = s.foods.some(f => f.x === rx && f.y === ry);
            if (onSnake || onFood) continue;

            const snack = COUPLE_SNACKS[Math.floor(Math.random() * COUPLE_SNACKS.length)];
            s.foods.push({ x: rx, y: ry, snack, pulse: 0 });
            break;
        }
    }, []);

    const spawnBurst = (x: number, y: number, color = '#22c55e', count = 20, speed = 180) => {
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
                life: 0.35 + Math.random() * 0.3,
                maxLife: 0.65,
                alpha: 1.0,
            });
        }
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#22c55e') => {
        stateRef.current.floatingTexts.push({
            x,
            y,
            text,
            color,
            life: 0.8,
        });
    };

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.snake = [
            { x: 12, y: 12 },
            { x: 11, y: 12 },
            { x: 10, y: 12 },
            { x: 9, y: 12 },
        ];
        s.dir = 'RIGHT';
        s.nextDir = 'RIGHT';
        s.score = 0;
        s.multiplier = 1;
        s.targetLength = 5;
        s.moveInterval = 0.085;
        s.boostTimer = 0;
        s.combo = 0;
        s.snacksEaten = 0;
        s.foods = [];
        s.particles = [];
        s.floatingTexts = [];
        s.holoFlash = null;
        s.gameState = 'playing';

        setScore(0);
        setMultiplier(1);
        setBoostActive(false);
        setGameState('playing');
        setLastRecordResult(null);

        spawnFood();
        spawnFood();
        ViperAudio.turn();
    }, [spawnFood]);

    const handleGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'gameover';
        setGameState('gameover');
        ViperAudio.crash();

        const res = recordScore('cyberviper', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

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

            // Update food pulse
            s.foods.forEach(f => {
                f.pulse += dt * 5;
            });

            // Update HoloFlash
            if (s.holoFlash && s.holoFlash.timer > 0) {
                s.holoFlash.timer -= dt;
                if (s.holoFlash.timer <= 0) s.holoFlash = null;
            }

            if (s.gameState === 'playing') {
                if (s.boostTimer > 0) {
                    s.boostTimer -= dt;
                    if (s.boostTimer <= 0) setBoostActive(false);
                }

                const currentInterval = s.boostTimer > 0 ? s.moveInterval * 0.5 : s.moveInterval;
                s.moveTimer += dt;

                if (s.moveTimer >= currentInterval) {
                    s.moveTimer = 0;
                    s.dir = s.nextDir;

                    const head = { ...s.snake[0] };
                    if (s.dir === 'UP') head.y -= 1;
                    if (s.dir === 'DOWN') head.y += 1;
                    if (s.dir === 'LEFT') head.x -= 1;
                    if (s.dir === 'RIGHT') head.x += 1;

                    // Wall Collision
                    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
                        spawnBurst(head.x * CELL_SIZE, head.y * CELL_SIZE, '#ef4444', 40, 260);
                        handleGameOver();
                    } else {
                        // Self Collision
                        const selfHit = s.snake.some((seg, idx) => idx > 0 && seg.x === head.x && seg.y === head.y);
                        if (selfHit) {
                            spawnBurst(head.x * CELL_SIZE, head.y * CELL_SIZE, '#f43f5e', 45, 280);
                            handleGameOver();
                        } else {
                            s.snake.unshift(head);

                            // Snack Food Consumption
                            let ate = false;
                            s.foods = s.foods.filter(f => {
                                if (f.x === head.x && f.y === head.y) {
                                    ate = true;
                                    s.combo++;
                                    s.snacksEaten++;
                                    const worldX = f.x * CELL_SIZE + CELL_SIZE / 2;
                                    const worldY = f.y * CELL_SIZE + CELL_SIZE / 2;

                                    const pts = f.snack.points * s.multiplier;
                                    s.score += pts;
                                    s.targetLength += f.snack.type === 'golden' ? 3 : 2;

                                    if (f.snack.type === 'golden') {
                                        ViperAudio.golden();
                                        spawnBurst(worldX, worldY, '#facc15', 30, 240);
                                        addFloatingText(worldX, worldY, `+${pts} ${f.snack.name.toUpperCase()}!`, '#facc15');
                                    } else if (f.snack.type === 'speed') {
                                        s.boostTimer = 4.0;
                                        setBoostActive(true);
                                        ViperAudio.boost();
                                        spawnBurst(worldX, worldY, '#06b6d4', 25, 220);
                                        addFloatingText(worldX, worldY, `⚡ BOOST: ${f.snack.name.toUpperCase()}`, '#06b6d4');
                                    } else if (f.snack.type === 'multiplier') {
                                        s.multiplier = Math.min(5, s.multiplier + 1);
                                        setMultiplier(s.multiplier);
                                        ViperAudio.golden();
                                        spawnBurst(worldX, worldY, '#a855f7', 25, 220);
                                        addFloatingText(worldX, worldY, `x${s.multiplier} COMBO: ${f.snack.name.toUpperCase()}!`, '#a855f7');
                                    } else {
                                        ViperAudio.eat(s.combo);
                                        spawnBurst(worldX, worldY, f.snack.color, 20, 180);
                                        addFloatingText(worldX, worldY, `+${pts} ${f.snack.name}`, f.snack.color);
                                    }

                                    // Holographic flash on every 5 snacks eaten or x4 multiplier
                                    if (s.snacksEaten % 5 === 0 && stylizedMemories.length > 0) {
                                        const randomMem = stylizedMemories[Math.floor(Math.random() * stylizedMemories.length)];
                                        s.holoFlash = { memory: randomMem, timer: 1.8, maxTimer: 1.8 };
                                    }

                                    setScore(s.score);
                                    if (s.score > s.highScore) {
                                        s.highScore = s.score;
                                        setHighScore(s.score);
                                    }

                                    return false;
                                }
                                return true;
                            });

                            if (ate) {
                                spawnFood();
                            }

                            if (!ate && s.snake.length > s.targetLength) {
                                s.snake.pop();
                            }
                        }
                    }
                }
            }

            // ── RENDER ──────────────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            // Cyber Grid Background
            ctx.fillStyle = '#060913';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Holographic Background Memory Flash
            if (s.holoFlash && s.holoFlash.memory.holoCanvas) {
                ctx.save();
                const progress = s.holoFlash.timer / s.holoFlash.maxTimer;
                ctx.globalAlpha = progress * 0.38;
                ctx.drawImage(s.holoFlash.memory.holoCanvas, 0, 0, V_WIDTH, V_HEIGHT);
                ctx.restore();
            }

            // Grid Cells
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.25)';
                    ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }

            // Neon Border
            ctx.strokeStyle = s.boostTimer > 0 ? '#06b6d4' : profileAccent;
            ctx.lineWidth = 3;
            ctx.strokeRect(1.5, 1.5, V_WIDTH - 3, V_HEIGHT - 3);

            // Render Couple Food / Snacks
            s.foods.forEach(f => {
                ctx.save();
                const cx = f.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = f.y * CELL_SIZE + CELL_SIZE / 2;

                // Subtle glowing aura
                ctx.shadowColor = f.snack.color;
                ctx.shadowBlur = 14 + Math.sin(f.pulse) * 6;

                // Emoji Snack Item
                ctx.font = `${CELL_SIZE - 2}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(f.snack.emoji, cx, cy);
                ctx.restore();
            });

            // Render Snake
            s.snake.forEach((seg, idx) => {
                ctx.save();
                const x = seg.x * CELL_SIZE;
                const y = seg.y * CELL_SIZE;

                if (idx === 0) {
                    // Head
                    ctx.fillStyle = s.boostTimer > 0 ? '#00f0ff' : profileAccent;
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 16;
                    ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

                    // Head Bezel
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

                    // Eyes
                    ctx.fillStyle = '#000000';
                    if (s.dir === 'RIGHT') {
                        ctx.fillRect(x + CELL_SIZE - 8, y + 5, 4, 4);
                        ctx.fillRect(x + CELL_SIZE - 8, y + CELL_SIZE - 9, 4, 4);
                    } else if (s.dir === 'LEFT') {
                        ctx.fillRect(x + 4, y + 5, 4, 4);
                        ctx.fillRect(x + 4, y + CELL_SIZE - 9, 4, 4);
                    } else if (s.dir === 'UP') {
                        ctx.fillRect(x + 5, y + 4, 4, 4);
                        ctx.fillRect(x + CELL_SIZE - 9, y + 4, 4, 4);
                    } else {
                        ctx.fillRect(x + 5, y + CELL_SIZE - 8, 4, 4);
                        ctx.fillRect(x + CELL_SIZE - 9, y + CELL_SIZE - 8, 4, 4);
                    }
                } else {
                    // Body Segments with Cyber Glow
                    const fade = 1 - idx / (s.snake.length + 10);
                    ctx.fillStyle = s.boostTimer > 0 ? '#0284c7' : profileAccent + 'cc';
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 8;
                    ctx.globalAlpha = Math.max(0.4, fade);
                    ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);

                    // Inner Core
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
                }
                ctx.restore();
            });

            // Render Particles
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

            // Render Floating Texts
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'black 12px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Filter
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
                for (let y = 0; y < V_HEIGHT; y += 4) {
                    ctx.fillRect(0, y, V_WIDTH, 1.5);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled, handleGameOver, profileAccent, stylizedMemories]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                if (s.dir !== 'DOWN') s.nextDir = 'UP';
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                if (s.dir !== 'UP') s.nextDir = 'DOWN';
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (s.dir !== 'RIGHT') s.nextDir = 'LEFT';
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (s.dir !== 'LEFT') s.nextDir = 'RIGHT';
            } else if (e.key === ' ' || e.key === 'Enter') {
                if (s.gameState !== 'playing') startNewGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [startNewGame]);

    // Touch Swipe Gestures
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const touch = e.touches[0];
        stateRef.current.touchStart = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const start = stateRef.current.touchStart;
        if (!start) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        const s = stateRef.current;
        if (Math.max(absDx, absDy) > 20) {
            if (absDx > absDy) {
                if (dx > 0 && s.dir !== 'LEFT') s.nextDir = 'RIGHT';
                else if (dx < 0 && s.dir !== 'RIGHT') s.nextDir = 'LEFT';
            } else {
                if (dy > 0 && s.dir !== 'UP') s.nextDir = 'DOWN';
                else if (dy < 0 && s.dir !== 'DOWN') s.nextDir = 'UP';
            }
        }
        stateRef.current.touchStart = null;
    };

    return (
        <div
            ref={containerRef}
            className="relative h-[65vh] max-h-[720px] min-h-[480px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="absolute inset-0 h-full w-full block object-contain select-none cursor-pointer touch-none"
            />

            {/* Top HUD */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
                <div className="flex items-center gap-2">
                    {/* Score */}
                    <div className="bg-black/85 border border-lime-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-lime-400 font-bold">SCORE</div>
                        <div className="text-base sm:text-xl font-black text-white tabular-nums">{score}</div>
                    </div>

                    {/* Head-to-head records badge */}
                    <div className="hidden sm:flex items-center gap-2 bg-black/85 border border-white/20 px-3 py-1.5 rounded-lg pointer-events-auto text-[10px]">
                        <div>
                            <span className="text-lime-400 font-bold">ÉL: {elBest}</span> · <span className="text-pink-400 font-bold">ELLA: {ellaBest}</span>
                        </div>
                    </div>

                    {/* Multiplier */}
                    {multiplier > 1 && (
                        <div className="bg-purple-500/20 border border-purple-400/60 px-2.5 py-1 rounded-lg animate-pulse pointer-events-auto">
                            <span className="text-xs font-black text-purple-300">x{multiplier} MULTI 🔥</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-lg transition-all ${crtEnabled ? 'border-lime-400 text-lime-400 bg-lime-950/60' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-lime-400" />}
                    </button>
                </div>
            </div>

            {/* Menu / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-lime-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                        <div className="text-lime-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Snack Viper 2088</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 IMPACTO EN LA MATRIZ' : 'CYBER VIPER 🐍'}
                        </h2>

                        <p className="text-xs text-white/70 mb-4 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Tu puntuación final fue de ${score} puntos.`
                                : 'Devora los antojitos y comidas favoritas de la pareja (sushi 🍣, matcha 🍵, boba 🧋, pizza 🍕). Desbloquea transmisiones de recuerdos con cada banquete.'}
                        </p>

                        {/* Record Results Banner */}
                        {lastRecordResult && (
                            <div className="mb-4 space-y-1.5 text-xs">
                                {lastRecordResult.isNewCoupleRecord && (
                                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black flex items-center justify-center gap-1.5 animate-bounce">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        <span>¡NUEVO RÉCORD DE PAREJA! 👑</span>
                                    </div>
                                )}
                                <div className="text-amber-300 font-bold">
                                    +{lastRecordResult.coinsEarned} Monedas de Sinergia ganadas 🪙
                                </div>
                            </div>
                        )}

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,197,94,0.6)] flex items-center justify-center gap-2"
                        >
                            {gameState === 'gameover' ? (
                                <>
                                    <RotateCcw className="w-5 h-5" />
                                    <span>JUGAR DE NUEVO 🔄</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>INICIAR BANQUETE 🕹️</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
