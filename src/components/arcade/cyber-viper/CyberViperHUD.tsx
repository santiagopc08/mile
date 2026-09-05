import React from 'react';
import { Tv, Volume2, VolumeX } from 'lucide-react';

interface CyberViperHUDProps {
    score: number;
    elBest: number;
    ellaBest: number;
    multiplier: number;
    crtEnabled: boolean;
    mutedState: boolean;
    onToggleCrt: () => void;
    onToggleMute: () => void;
}

export function CyberViperHUD({
    score,
    elBest,
    ellaBest,
    multiplier,
    crtEnabled,
    mutedState,
    onToggleCrt,
    onToggleMute
}: CyberViperHUDProps) {
    return (
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
                    onClick={onToggleCrt}
                    className={`p-2 border rounded-lg transition-all ${crtEnabled ? 'border-lime-400 text-lime-400 bg-lime-950/60' : 'border-white/20 text-white/40 bg-black/80'}`}
                    title="Filtro CRT"
                >
                    <Tv className="w-4 h-4" />
                </button>

                <button
                    onClick={onToggleMute}
                    className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                >
                    {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-lime-400" />}
                </button>
            </div>
        </div>
    );
}
