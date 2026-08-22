'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ViperAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Sparkles, Trophy, RotateCcw, Tv, Zap } from 'lucide-react';

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

interface Segment {
    x: number;
    y: number;
}

interface Food {
    x: number;
    y: number;
    type: FoodType;
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

export function CyberViperCanvas({ accentColor = '#22c55e' }: CyberViperProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [boostActive, setBoostActive] = useState(false);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

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
        score: 0,
        highScore: 0,
        multiplier: 1,
        targetLength: 5,
        moveTimer: 0,
        moveInterval: 0.085,
        boostTimer: 0,
        combo: 0,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover',
        touchStart: null as { x: number; y: number } | null,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('cyber_viper_highscore');
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

    const spawnFood = useCallback(() => {
        const s = stateRef.current;
        if (s.foods.length >= 3) return;

        for (let i = 0; i < 100; i++) {
            const rx = Math.floor(Math.random() * (COLS - 2)) + 1;
            const ry = Math.floor(Math.random() * (ROWS - 2)) + 1;

            const onSnake = s.snake.some(seg => seg.x === rx && seg.y === ry);
            const onFood = s.foods.some(f => f.x === rx && f.y === ry);
            if (onSnake || onFood) continue;

            const roll = Math.random();
            const type: FoodType =
                roll > 0.85 ? 'golden' : roll > 0.70 ? 'speed' : roll > 0.55 ? 'multiplier' : 'standard';

            s.foods.push({ x: rx, y: ry, type, pulse: 0 });
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
        s.foods = [];
        s.particles = [];
        s.floatingTexts = [];
        s.gameState = 'playing';

        setScore(0);
        setMultiplier(1);
        setBoostActive(false);
        setGameState('playing');

        spawnFood();
        spawnFood();
        ViperAudio.turn();
    }, [spawnFood]);

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
                        ViperAudio.crash();
                        spawnBurst(head.x * CELL_SIZE, head.y * CELL_SIZE, '#ef4444', 40, 260);
                        s.gameState = 'gameover';
                        setGameState('gameover');
                    } else {
                        // Self Collision
                        const selfHit = s.snake.some((seg, idx) => idx > 0 && seg.x === head.x && seg.y === head.y);
                        if (selfHit) {
                            ViperAudio.crash();
                            spawnBurst(head.x * CELL_SIZE, head.y * CELL_SIZE, '#f43f5e', 45, 280);
                            s.gameState = 'gameover';
                            setGameState('gameover');
                        } else {
                            s.snake.unshift(head);

                            // Food Consumption
                            let ate = false;
                            s.foods = s.foods.filter(f => {
                                if (f.x === head.x && f.y === head.y) {
                                    ate = true;
                                    s.combo++;
                                    const worldX = f.x * CELL_SIZE + CELL_SIZE / 2;
                                    const worldY = f.y * CELL_SIZE + CELL_SIZE / 2;

                                    if (f.type === 'standard') {
                                        const pts = 100 * s.multiplier;
                                        s.score += pts;
                                        s.targetLength += 2;
                                        ViperAudio.eat(s.combo);
                                        spawnBurst(worldX, worldY, '#22c55e', 20, 180);
                                        addFloatingText(worldX, worldY, `+${pts}`, '#22c55e');
                                    } else if (f.type === 'golden') {
                                        const pts = 300 * s.multiplier;
                                        s.score += pts;
                                        s.targetLength += 3;
                                        ViperAudio.golden();
                                        spawnBurst(worldX, worldY, '#facc15', 30, 240);
                                        addFloatingText(worldX, worldY, `+${pts} GOLDEN!`, '#facc15');
                                    } else if (f.type === 'speed') {
                                        s.score += 150;
                                        s.boostTimer = 4.0;
                                        setBoostActive(true);
                                        ViperAudio.boost();
                                        spawnBurst(worldX, worldY, '#06b6d4', 25, 220);
                                        addFloatingText(worldX, worldY, 'HYPER OVERDRIVE ⚡', '#06b6d4');
                                    } else if (f.type === 'multiplier') {
                                        s.score += 200;
                                        s.multiplier = Math.min(5, s.multiplier + 1);
                                        setMultiplier(s.multiplier);
                                        ViperAudio.golden();
                                        spawnBurst(worldX, worldY, '#a855f7', 25, 220);
                                        addFloatingText(worldX, worldY, `x${s.multiplier} MULTIPLIER!`, '#a855f7');
                                    }

                                    setScore(s.score);
                                    if (s.score > s.highScore) {
                                        s.highScore = s.score;
                                        setHighScore(s.score);
                                        localStorage.setItem('cyber_viper_highscore', s.score.toString());
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

            // Subtle Grid Cells
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)';
                    ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }

            // Neon Border
            ctx.strokeStyle = s.boostTimer > 0 ? '#06b6d4' : '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(1.5, 1.5, V_WIDTH - 3, V_HEIGHT - 3);

            // Render Food
            s.foods.forEach(f => {
                ctx.save();
                const cx = f.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = f.y * CELL_SIZE + CELL_SIZE / 2;
                const col =
                    f.type === 'golden'
                        ? '#facc15'
                        : f.type === 'speed'
                        ? '#06b6d4'
                        : f.type === 'multiplier'
                        ? '#a855f7'
                        : '#22c55e';

                const scale = 1.0 + Math.sin(f.pulse) * 0.15;
                const radius = (CELL_SIZE * 0.35) * scale;

                ctx.shadowColor = col;
                ctx.shadowBlur = 14;
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();

                // Inner core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            });

            // Render Snake Segments
            s.snake.forEach((seg, idx) => {
                ctx.save();
                const px = seg.x * CELL_SIZE + 2;
                const py = seg.y * CELL_SIZE + 2;
                const sz = CELL_SIZE - 4;

                const isHead = idx === 0;
                const col = isHead
                    ? s.boostTimer > 0
                        ? '#06b6d4'
                        : '#22c55e'
                    : `hsl(${140 + idx * 2.5}, 85%, ${Math.max(35, 65 - idx * 0.8)}%)`;

                ctx.shadowColor = isHead ? (s.boostTimer > 0 ? '#06b6d4' : '#22c55e') : 'rgba(34,197,94,0.3)';
                ctx.shadowBlur = isHead ? 16 : 6;
                ctx.fillStyle = col;
                ctx.fillRect(px, py, sz, sz);

                // Head glowing eye optics
                if (isHead) {
                    ctx.fillStyle = '#ffffff';
                    if (s.dir === 'RIGHT') {
                        ctx.fillRect(px + sz - 6, py + 4, 3, 3);
                        ctx.fillRect(px + sz - 6, py + sz - 7, 3, 3);
                    } else if (s.dir === 'LEFT') {
                        ctx.fillRect(px + 3, py + 4, 3, 3);
                        ctx.fillRect(px + 3, py + sz - 7, 3, 3);
                    } else if (s.dir === 'UP') {
                        ctx.fillRect(px + 4, py + 3, 3, 3);
                        ctx.fillRect(px + sz - 7, py + 3, 3, 3);
                    } else if (s.dir === 'DOWN') {
                        ctx.fillRect(px + 4, py + sz - 6, 3, 3);
                        ctx.fillRect(px + sz - 7, py + sz - 6, 3, 3);
                    }
                }
                ctx.restore();
            });

            // Render Particles
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

            // Render Floating Text
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 12px monospace';
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
    }, [crtEnabled, spawnFood]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                if (s.dir !== 'DOWN') s.nextDir = 'UP';
                ViperAudio.turn();
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                if (s.dir !== 'UP') s.nextDir = 'DOWN';
                ViperAudio.turn();
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (s.dir !== 'RIGHT') s.nextDir = 'LEFT';
                ViperAudio.turn();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (s.dir !== 'LEFT') s.nextDir = 'RIGHT';
                ViperAudio.turn();
            } else if (e.key === ' ' || e.key === 'Enter') {
                if (s.gameState === 'menu' || s.gameState === 'gameover') {
                    startNewGame();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [startNewGame]);

    // Swipe controls for mobile
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

        if (Math.hypot(dx, dy) < 20) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && s.dir !== 'LEFT') s.nextDir = 'RIGHT';
            else if (dx < 0 && s.dir !== 'RIGHT') s.nextDir = 'LEFT';
        } else {
            if (dy > 0 && s.dir !== 'UP') s.nextDir = 'DOWN';
            else if (dy < 0 && s.dir !== 'DOWN') s.nextDir = 'UP';
        }
        ViperAudio.turn();
    };

    const setDirection = (newDir: Direction) => {
        const s = stateRef.current;
        if (newDir === 'UP' && s.dir !== 'DOWN') s.nextDir = 'UP';
        if (newDir === 'DOWN' && s.dir !== 'UP') s.nextDir = 'DOWN';
        if (newDir === 'LEFT' && s.dir !== 'RIGHT') s.nextDir = 'LEFT';
        if (newDir === 'RIGHT' && s.dir !== 'LEFT') s.nextDir = 'RIGHT';
        ViperAudio.turn();
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative h-[72vh] max-h-[780px] min-h-[500px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono"
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
                    <div className="bg-black/85 border border-emerald-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(34,197,94,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">SCORE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-bold">HIGH</div>
                        <div className="text-base sm:text-lg font-black text-amber-400 tabular-nums">{highScore}</div>
                    </div>
                    {multiplier > 1 && (
                        <div className="bg-black/85 border border-purple-500/50 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                            <div className="text-[8px] uppercase tracking-widest text-purple-400 font-bold">BONUS</div>
                            <div className="text-base sm:text-lg font-black text-purple-300 tabular-nums">x{multiplier}</div>
                        </div>
                    )}
                    {boostActive && (
                        <div className="bg-cyan-500/20 border border-cyan-400 px-2.5 py-1.5 rounded-lg pointer-events-auto animate-pulse flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[10px] font-black text-cyan-300">OVERDRIVE</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-lg transition-all ${crtEnabled ? 'border-emerald-400 text-emerald-400 bg-emerald-950/60' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile On-Screen Virtual D-pad (Only visible on touch devices) */}
            <div className="sm:hidden absolute bottom-4 right-4 z-20 grid grid-cols-3 gap-1 w-32 h-32 bg-black/60 p-2 rounded-2xl border border-white/15 backdrop-blur-md">
                <div />
                <button
                    onClick={() => setDirection('UP')}
                    className="bg-white/10 active:bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm"
                >
                    ▲
                </button>
                <div />
                <button
                    onClick={() => setDirection('LEFT')}
                    className="bg-white/10 active:bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm"
                >
                    ◀
                </button>
                <div />
                <button
                    onClick={() => setDirection('RIGHT')}
                    className="bg-white/10 active:bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm"
                >
                    ▶
                </button>
                <div />
                <button
                    onClick={() => setDirection('DOWN')}
                    className="bg-white/10 active:bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm"
                >
                    ▼
                </button>
                <div />
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-emerald-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Native Vector Arcade</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 VIPER DESTROYED' : 'CYBER VIPER 2088 🐍'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Tu racha ha terminado con ${score} puntos. ¡Rebootea el sistema e inténtalo de nuevo!`
                                : 'Desliza por la cuadrícula vectorial, recolecta núcleos de plasma, activa el Overdrive y multiplica tu puntuación.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                        >
                            {gameState === 'gameover' ? 'REBOOT VIPER 🔄' : 'DESPLEGAR EN LA RED 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
