import React from 'react';
import { Crown, RotateCcw, Sparkles } from 'lucide-react';

interface CyberViperMenuProps {
    gameState: 'menu' | 'playing' | 'gameover';
    score: number;
    lastRecordResult: { isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null;
    onStartGame: () => void;
}

export function CyberViperMenu({
    gameState,
    score,
    lastRecordResult,
    onStartGame
}: CyberViperMenuProps) {
    if (gameState === 'playing') return null;

    return (
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
                    onClick={onStartGame}
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
    );
}
