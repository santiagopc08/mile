'use client';

import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCw, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Tv } from 'lucide-react';
import { TetrisAudio } from '@/lib/arcadeAudio';
import { useTetrisLogic } from '@/hooks/arcade/useTetrisLogic';
import {
    TetrominoType, TETROMINO_COLORS, getPieceOffsets,
    COLS, ROWS, CELL_SIZE, BOARD_X, BOARD_Y, V_WIDTH, V_HEIGHT
} from '@/components/arcade/tetrisConstants';

interface TetrisMatrixProps {
    accentColor?: string;
}

export function TetrisMatrixCanvas({ accentColor = '#00f0ff' }: TetrisMatrixProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const {
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
    } = useTetrisLogic();

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
