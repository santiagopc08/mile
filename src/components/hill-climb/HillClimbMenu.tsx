'use client';

import React from 'react';
import { useHillClimbStore } from '@/stores/useHillClimbStore';
import { Play, RotateCcw, Trophy, Flame, ShieldAlert, Coins, Sparkles } from 'lucide-react';

interface HillClimbMenuProps {
    onStartGame: () => void;
    accentColor?: string;
}

export function HillClimbMenu({ onStartGame, accentColor = '#c3f400' }: HillClimbMenuProps) {
    const gameState = useHillClimbStore((s) => s.gameState);
    const distance = useHillClimbStore((s) => s.distance);
    const coins = useHillClimbStore((s) => s.coins);
    const highScore = useHillClimbStore((s) => s.highScore);
    const bestCoins = useHillClimbStore((s) => s.bestCoins);
    const deathReason = useHillClimbStore((s) => s.deathReason);
    const isNewRecord = useHillClimbStore((s) => s.isNewRecord);

    if (gameState === 'PLAYING') return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0d0618]/80 p-3 font-mono backdrop-blur-xl select-none sm:p-4">
            {gameState === 'MENU' && (
                <div
                    className="my-auto w-full max-w-md space-y-4 rounded-3xl border border-white/15 bg-[#150b23]/95 p-5 text-center shadow-2xl sm:space-y-4 sm:p-6"
                    style={{ boxShadow: `0 0 70px ${accentColor}22, 0 24px 60px rgba(0,0,0,0.6)` }}
                >
                    <div className="space-y-2.5">
                        <div
                            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs"
                            style={{
                                color: accentColor,
                                borderColor: `${accentColor}55`,
                                backgroundColor: `${accentColor}18`,
                            }}
                        >
                            <Flame className="h-3.5 w-3.5" /> Hill Climb
                        </div>
                        <h2 className="text-2xl font-black uppercase text-white sm:text-3xl sm:tracking-wider">
                            Buggy Mountain
                        </h2>
                        <p className="text-[11px] leading-relaxed text-white/60 sm:text-xs">
                            Llega lo más lejos que puedas sin volcar ni quedarte sin gasolina.
                        </p>
                    </div>

                    {(highScore > 0 || bestCoins > 0) && (
                        <div className="grid grid-cols-2 gap-2.5">
                            <RecordChip
                                icon={<Trophy className="h-4 w-4 text-amber-400" />}
                                label="Récord"
                                value={`${highScore} m`}
                            />
                            <RecordChip
                                icon={<Coins className="h-4 w-4 text-amber-400" />}
                                label="Mejor botín"
                                value={`${bestCoins}`}
                            />
                        </div>
                    )}

                    {/* Las dos últimas filas se ocultan en lienzos bajos para que
                        el botón de empezar no quede fuera de la vista. */}
                    <div className="space-y-1.5 rounded-2xl border border-white/10 bg-black/35 p-3 text-left text-[11px] text-white/70 sm:space-y-2 sm:p-3.5">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Controles
                        </div>
                        <ControlRow keys="Pedal derecho · D · ↑" action="Acelerar" actionColor="#34d399" />
                        <ControlRow keys="Pedal izquierdo · A · ↓" action="Frenar / atrás" actionColor="#f87171" />
                        <div className="hidden space-y-2 sm:block">
                            <ControlRow keys="En el aire" action="Inclinan el morro" actionColor="#c4b5fd" />
                            <ControlRow keys="R" action="Reiniciar" actionColor="#93c5fd" />
                        </div>
                    </div>

                    <StartButton onClick={onStartGame} accentColor={accentColor}>
                        <Play className="h-6 w-6 fill-current" /> Empezar carrera
                    </StartButton>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="my-auto w-full max-w-md space-y-4 rounded-3xl border border-red-500/30 bg-[#150b23]/95 p-5 text-center shadow-[0_0_70px_rgba(239,68,68,0.2)] sm:space-y-4 sm:p-6">
                    <div className="space-y-2.5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300 sm:text-xs">
                            <ShieldAlert className="h-3.5 w-3.5" /> Fin de la carrera
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
                            {isNewRecord ? '¡Nuevo récord!' : 'Se acabó'}
                        </h2>
                        {deathReason && (
                            <p className="rounded-xl border border-red-500/25 bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-200">
                                {deathReason}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-2xl border p-4 text-left"
                            style={{ borderColor: `${accentColor}44`, backgroundColor: `${accentColor}12` }}
                        >
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Distancia</span>
                            <div className="mt-1 text-2xl font-black" style={{ color: accentColor }}>
                                {distance} m
                            </div>
                        </div>
                        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Monedas</span>
                            <div className="mt-1 text-2xl font-black text-amber-300">+{coins}</div>
                        </div>
                    </div>

                    {isNewRecord ? (
                        <div
                            className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider"
                            style={{
                                color: accentColor,
                                borderColor: `${accentColor}55`,
                                backgroundColor: `${accentColor}18`,
                            }}
                        >
                            <Sparkles className="h-4 w-4" /> Has batido tu marca anterior
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span>
                                Récord personal: <strong className="text-white/85">{highScore} m</strong>
                            </span>
                        </div>
                    )}

                    <StartButton onClick={onStartGame} accentColor={accentColor}>
                        <RotateCcw className="h-6 w-6" /> Intentar de nuevo
                    </StartButton>
                </div>
            )}
        </div>
    );
}

function StartButton({
    onClick,
    accentColor,
    children,
}: {
    onClick: () => void;
    accentColor: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl py-3.5 text-base font-black uppercase tracking-wider text-[#12100f] transition-all hover:brightness-110 active:scale-95 sm:gap-3 sm:py-5 sm:text-xl"
            style={{ backgroundColor: accentColor, boxShadow: `0 14px 34px ${accentColor}33` }}
        >
            {children}
        </button>
    );
}

function RecordChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5">
            {icon}
            <div className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
                <span className="mt-0.5 text-sm font-black text-white/90">{value}</span>
            </div>
        </div>
    );
}

function ControlRow({ keys, action, actionColor }: { keys: string; action: string; actionColor: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-white/55">{keys}</span>
            <span className="font-bold" style={{ color: actionColor }}>
                {action}
            </span>
        </div>
    );
}
