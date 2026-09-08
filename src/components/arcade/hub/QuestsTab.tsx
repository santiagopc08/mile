import React from 'react';
import { Coins, CheckCircle2, Sparkles } from 'lucide-react';
import { ArcadeQuest } from '@/lib/arcadeProgression';

interface QuestsTabProps {
    dailyQuests: ArcadeQuest[];
    onClaimQuest: (questId: string) => void;
}

export function QuestsTab({ dailyQuests, onClaimQuest }: QuestsTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-wider text-white/60">
                    Misiones del Día · Se renuevan diariamente
                </div>
                <div className="text-[10px] text-amber-400 font-bold uppercase">
                    Gana monedas para el Gachapon
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dailyQuests.map(q => {
                    const progressPct = Math.min(100, Math.round((q.current / q.target) * 100));

                    return (
                        <div
                            key={q.id}
                            className={`p-4 rounded-2xl border transition-all ${
                                q.completed
                                    ? 'border-amber-400/50 bg-amber-950/20 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                                    : 'border-white/10 bg-white/[0.02]'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="text-xs font-black text-white uppercase">{q.title}</div>
                                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300">
                                    <Coins className="w-3 h-3 text-amber-400" />
                                    <span>+{q.rewardCoins}</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-white/70 mb-3">{q.description}</p>

                            <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
                                    <span>PROGRESO</span>
                                    <span>{q.current} / {q.target} ({progressPct}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>

                            {q.completed ? (
                                q.claimed ? (
                                    <div className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-center text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>RECOMPENSA RECLAMADA</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onClaimQuest(q.id)}
                                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-fuchsia-500 text-black font-black uppercase text-xs rounded-xl hover:scale-102 active:scale-98 transition-all shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>RECLAMAR +{q.rewardCoins} MONEDAS</span>
                                    </button>
                                )
                            ) : (
                                <div className="w-full py-2 bg-white/5 rounded-xl text-center text-[10px] font-bold text-white/40 uppercase">
                                    En Progreso
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
