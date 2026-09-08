import React from 'react';
import { Crown, Play } from 'lucide-react';
import { GAMES_METADATA, GameTab } from '../ArcadeGameSelector';

interface DuelsTabProps {
    elWins: number;
    ellaWins: number;
    scores: Record<string, { el?: number; ella?: number; }>;
    onSelectGame: (gameId: GameTab) => void;
    onClose: () => void;
}

export function DuelsTab({ elWins, ellaWins, scores, onSelectGame, onClose }: DuelsTabProps) {
    const gameKeys = Object.keys(GAMES_METADATA) as GameTab[];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl border border-lime-400/40 bg-lime-950/20 shadow-[0_0_25px_rgba(195,244,0,0.15)] flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-bold text-lime-400 uppercase tracking-widest flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-lime-400" /> Santi (Él)
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white">{elWins} <span className="text-xs text-lime-400 font-bold uppercase">Victorias</span></div>
                    </div>
                    <div className="text-3xl">🎮</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl border border-pink-400/40 bg-pink-950/20 shadow-[0_0_25px_rgba(255,75,137,0.15)] flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-pink-400" /> Mile (Ella)
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white">{ellaWins} <span className="text-xs text-pink-400 font-bold uppercase">Victorias</span></div>
                    </div>
                    <div className="text-3xl">👑</div>
                </div>
            </div>

            <div className="space-y-2.5">
                <div className="text-xs font-black uppercase tracking-wider text-white/50 px-1">
                    Tabla de Récords por Juego
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameKeys.map(k => {
                        const meta = GAMES_METADATA[k];
                        const rec = scores[k] || { el: 0, ella: 0 };
                        const leader = (rec.el || 0) > (rec.ella || 0) ? 'el' : (rec.ella || 0) > (rec.el || 0) ? 'ella' : 'tie';
                        const Icon = meta.icon;

                        return (
                            <div
                                key={k}
                                className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2.5 rounded-xl border border-white/15"
                                        style={{ backgroundColor: `${meta.accentHex}20`, borderColor: `${meta.accentHex}50` }}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase">{meta.shortTitle}</div>
                                        <div className="text-[10px] text-white/50 font-mono">
                                            Él: <span className="text-lime-400 font-bold tabular-nums">{rec.el || 0}</span> · Ella: <span className="text-pink-400 font-bold tabular-nums">{rec.ella || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {leader === 'el' && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime-500/20 border border-lime-400 text-lime-300">
                                            👑 Él
                                        </span>
                                    )}
                                    {leader === 'ella' && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400 text-pink-300">
                                            👑 Ella
                                        </span>
                                    )}
                                    {leader === 'tie' && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                                            Empate
                                        </span>
                                    )}

                                    <button
                                        onClick={() => {
                                            onSelectGame(k);
                                            onClose();
                                        }}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white transition-all"
                                        title="Jugar este juego"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
