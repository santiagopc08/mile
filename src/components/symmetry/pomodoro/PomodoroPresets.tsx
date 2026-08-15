import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Focus, Flame, Shield, SlidersHorizontal } from 'lucide-react';
import { PRESETS } from './usePomodoroTimer';

const iconMap: Record<string, any> = {
    Zap,
    Focus,
    Flame,
    Shield
};

interface PomodoroPresetsProps {
    totalBudget: number;
    updateBudget: (mins: number) => void;
    showConfig: boolean;
    setShowConfig: (show: boolean) => void;
    accentHex: string;
}

export function PomodoroPresets({
    totalBudget,
    updateBudget,
    showConfig,
    setShowConfig,
    accentHex
}: PomodoroPresetsProps) {
    return (
        <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono uppercase font-bold tracking-[0.2em] text-[#a88a7e]">
                    PRESETS RÁPIDOS DE ENFOQUE
                </span>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-[8px] font-mono text-[#a88a7e] hover:text-white uppercase tracking-wider flex items-center gap-1"
                >
                    <SlidersHorizontal size={10} />
                    {showConfig ? 'Ocultar ajustes' : 'Ajuste manual'}
                </button>
            </div>

            {/* 4 Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                    const isSelected = totalBudget === p.duration;
                    const Icon = iconMap[p.icon] || Focus;

                    return (
                        <button
                            key={p.duration}
                            onClick={() => updateBudget(p.duration)}
                            className={`group relative p-2.5 border text-left transition-all ${
                                isSelected
                                    ? 'border-white/40 bg-white/[0.08] shadow-md'
                                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                            style={{ borderColor: isSelected ? accentHex : undefined }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <Icon className="h-3.5 w-3.5" style={{ color: isSelected ? accentHex : '#a88a7e' }} />
                                <span className={`text-[8px] font-mono font-bold ${isSelected ? 'text-white' : 'text-white/30'}`}>
                                    {p.duration}m
                                </span>
                            </div>
                            <span className={`block font-mono text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-[#e5e2e1]/80'}`}>
                                {p.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Manual Slider Drawer */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-white/[0.02] border border-white/10 space-y-2 pt-3 overflow-hidden"
                    >
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#a88a7e]">
                            <span>AJUSTE PERSONALIZADO</span>
                            <span className="font-bold text-white">{totalBudget} MINUTOS</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="180"
                            step="5"
                            value={totalBudget}
                            onChange={(e) => updateBudget(parseInt(e.target.value))}
                            className="w-full h-1.5 cursor-pointer appearance-none bg-white/10 accent-white"
                        />
                        <div className="flex items-center justify-between text-[7px] font-mono text-white/30 pt-0.5">
                            <span>5m</span>
                            <span>60m</span>
                            <span>120m</span>
                            <span>180m</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
