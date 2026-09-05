import React from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { ArcadeCoupon } from '@/lib/arcadeProgression';

interface GachaponTabProps {
    coins: number;
    gachaponCost: number;
    isSpinning: boolean;
    wonCoupon: ArcadeCoupon | null;
    gachaponError: string | null;
    onSpin: () => void;
}

export function GachaponTab({ coins, gachaponCost, isSpinning, wonCoupon, gachaponError, onSpin }: GachaponTabProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-fuchsia-500/50 bg-gradient-to-b from-fuchsia-950/60 to-purple-950/80 p-4 shadow-[0_0_50px_rgba(217,70,239,0.4)] flex items-center justify-center">
                <motion.div
                    animate={isSpinning ? { rotate: [0, 360, 720, 1080], scale: [1, 1.15, 0.95, 1] } : {}}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="text-6xl sm:text-7xl"
                >
                    {isSpinning ? '🎰' : wonCoupon ? wonCoupon.emoji : '🎁'}
                </motion.div>
            </div>

            <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    Cápsula de Premios de Amor
                </h3>
                <p className="text-xs text-white/60 max-w-md mx-auto mt-1">
                    Gira la ruleta gachapon para ganar cupones reales de pareja (masajes, elecciones de películas, cenas, inmunidad de tareas y más).
                </p>
            </div>

            {wonCoupon && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-5 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-950/40 shadow-[0_0_30px_rgba(217,70,239,0.5)] max-w-md w-full text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">{wonCoupon.emoji}</div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">
                                ¡NUEVO CUPÓN DESBLOQUEADO!
                            </div>
                            <div className="text-base font-black text-white">{wonCoupon.title}</div>
                            <div className="text-xs text-white/70 mt-0.5">{wonCoupon.description}</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {gachaponError && (
                <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/40 px-4 py-2 rounded-xl">
                    {gachaponError}
                </div>
            )}

            <button
                onClick={onSpin}
                disabled={coins < gachaponCost || isSpinning}
                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-base transition-all flex items-center gap-3 shadow-xl ${
                    coins >= gachaponCost && !isSpinning
                        ? 'bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(217,70,239,0.5)]'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
            >
                <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'GIRANDO CÁPSULA...' : `GIRAR GACHAPON (${gachaponCost} 🪙)`}</span>
            </button>
        </div>
    );
}
