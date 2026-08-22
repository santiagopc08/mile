import React from 'react';
import { motion } from 'framer-motion';
import { getComboTier } from '@/lib/mahjong/logic';
import { Flame, Zap, Sparkles, Crown } from 'lucide-react';

interface ComboSignProps {
    comboSign: { id: number; text: string; combo: number };
}

export function ComboSign({ comboSign }: ComboSignProps) {
    const tier = getComboTier(comboSign.combo);
    const isUltraTier = comboSign.combo >= 5;

    const TierIcon = () => {
        if (comboSign.combo >= 5) return <Crown className="w-4 h-4 text-yellow-300 animate-bounce" />;
        if (comboSign.combo >= 4) return <Flame className="w-4 h-4 text-rose-400 animate-pulse" />;
        if (comboSign.combo >= 3) return <Zap className="w-4 h-4 text-orange-400 animate-bounce" />;
        if (comboSign.combo >= 2) return <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
        return <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />;
    };

    return (
        <motion.div
            key={comboSign.id}
            initial={{ opacity: 0, y: -24, scale: 0.75 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 1.15, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className="fixed top-[calc(env(safe-area-inset-top,0px)+52px)] sm:top-[64px] left-1/2 -translate-x-1/2 z-[99995] pointer-events-none select-none"
        >
            {/* Ambient radiant glow behind the badge */}
            <div
                className="absolute -inset-3 rounded-2xl opacity-75 blur-lg transition-all duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 75%)` }}
            />

            {/* Main Cyber-Arcade Combo Pill */}
            <div
                className={`relative flex items-center gap-2.5 sm:gap-3.5 px-3.5 py-1.5 sm:px-5 sm:py-2 bg-black/90 backdrop-blur-xl border-2 rounded-xl transition-all shadow-2xl ${
                    comboSign.combo >= 3 ? 'animate-combo-shake' : ''
                }`}
                style={{
                    borderColor: tier.box,
                    boxShadow: `0 0 20px 2px ${tier.glow}, inset 0 0 12px 1px ${tier.glow}`,
                }}
            >
                {/* 3D Extrusion Accent */}
                <div
                    className="absolute inset-0 translate-x-[2px] translate-y-[2px] -z-10 rounded-xl border border-black"
                    style={{ backgroundColor: tier.box, opacity: 0.4 }}
                />

                {/* Left: Animated Tier Icon & Multiplier */}
                <div className="flex items-center gap-1.5 font-mono">
                    <TierIcon />
                    <motion.span
                        key={`combo-num-${comboSign.combo}`}
                        initial={{ scale: 1.6, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        className="font-black italic text-xl sm:text-2xl tracking-tighter"
                        style={{
                            color: tier.box,
                            textShadow: `0 0 12px ${tier.glow}, 0 0 24px ${tier.box}`,
                        }}
                    >
                        x{comboSign.combo}
                    </motion.span>
                </div>

                {/* Center Divider */}
                <div className="w-[1.5px] h-5 bg-white/20" />

                {/* Right: Punchy Streak Text */}
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-[0.25em] text-white/50 mb-0.5">
                        {isUltraTier ? '🔥 RACHA DIVINA' : 'RACHA DE FUEGO'}
                    </span>
                    <span
                        className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider text-white"
                        style={{
                            color: tier.text,
                            textShadow: `0 0 10px ${tier.glow}, 0 2px 4px rgba(0,0,0,0.8)`,
                        }}
                    >
                        {comboSign.text}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
