import React from 'react';
import { motion } from 'framer-motion';
import { getComboTier } from '@/lib/mahjong/logic';

interface ComboSignProps {
    comboSign: { id: number; text: string; combo: number };
}

export function ComboSign({ comboSign }: ComboSignProps) {
    const tier = getComboTier(comboSign.combo);

    return (
        <motion.div
            key={comboSign.id}
            initial={{ opacity: 0, y: -45, scale: 0.35, rotate: -8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.4, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 13 }}
            className="fixed top-[13%] left-1/2 -translate-x-1/2 z-[99995] pointer-events-none select-none"
        >
            {/* Multiplicador gigante ascendente con estallido de luz */}
            {comboSign.combo >= 2 && (
                <motion.div
                    key={`mult-${comboSign.id}`}
                    initial={{ opacity: 1, scale: 0.5, y: 0 }}
                    animate={{ opacity: 0, scale: 2.6, y: -45 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 font-black italic text-6xl md:text-7xl font-mono"
                    style={{ color: tier.box, textShadow: `0 0 35px ${tier.glow}, 0 0 60px ${tier.box}` }}
                >
                    x{comboSign.combo}
                </motion.div>
            )}
            {/* Resplandor térmico de fondo detrás del banner */}
            <div
                className="absolute -inset-4 rounded-xl opacity-60 blur-xl animate-pulse"
                style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 80%)` }}
            />
            {/* Sombra 3D del letrero */}
            <div
                className="absolute inset-0 translate-x-[6px] translate-y-[6px] border-2 border-black"
                style={{ backgroundColor: tier.box, boxShadow: `0 0 40px ${tier.glow}` }}
            />
            {/* Caja principal */}
            <div
                className={`relative border-2 bg-black/95 px-9 py-4 text-center shimmer-sweep ${comboSign.combo >= 3 ? 'animate-combo-shake' : ''}`}
                style={{ borderColor: tier.box, boxShadow: `0 0 25px ${tier.glow}` }}
            >
                <div className={`flex items-center justify-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.3em] mb-1 ${tier.label}`}>
                    <span className="animate-bounce">{tier.emoji}</span>
                    Racha de Fuego
                    <span className="animate-bounce">{tier.emoji}</span>
                </div>
                <div
                    className="font-sans font-black text-2xl md:text-4xl uppercase tracking-wider text-white"
                    style={{ color: tier.text, textShadow: `0 0 15px ${tier.glow}, 0 2px 8px rgba(0,0,0,0.9)` }}
                >
                    {comboSign.text}
                </div>
            </div>
        </motion.div>
    );
}
