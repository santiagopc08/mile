import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

interface SharedStatusHeaderProps {
    bothActiveToday: boolean;
    accentColor: string;
    isUsingLocalStorage: boolean;
    motivationalMessage: { title: string; text: string };
    syncStreak: number;
    weeklyStats: {
        totalCompleted: number;
        goalProgressPercentage: number;
        activeDaysCount: number;
        recoveryDays: number;
    };
    renderChunkedBar: (percentage: number, color: string) => React.ReactNode;
    feedbackMessage: string | null;
}

export function SharedStatusHeader({
    bothActiveToday,
    accentColor,
    isUsingLocalStorage,
    motivationalMessage,
    syncStreak,
    weeklyStats,
    renderChunkedBar,
    feedbackMessage
}: SharedStatusHeaderProps) {
    return (
        <>
            {/* CAPA 1: SHARED STATUS HEADER WITH GLOW DUAL */}
            <div className={`relative border p-6 bg-black transition-all duration-700 rounded-none ${
                bothActiveToday
                    ? 'border-transparent shadow-[0_0_20px_rgba(195,244,0,0.15),_0_0_20px_rgba(255,75,137,0.15)]'
                    : 'border-white/10'
            }`}>
                {/* Visual dual synchronized glow backgrounds */}
                {bothActiveToday && (
                    <>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c3f400] to-[#ff4b89]" />
                        <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-tr from-[#c3f400] via-transparent to-[#ff4b89] pointer-events-none" />
                        <div className="absolute -top-1 left-4 px-2 py-0.5 bg-gradient-to-r from-[#c3f400] to-[#ff4b89] text-black text-[7px] font-black tracking-widest uppercase rounded-none font-mono">
                            GLOW_DUAL_SYNCED_ACTIVE
                        </div>
                    </>
                )}

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span
                                className="border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.25em] rounded-none font-mono"
                                style={{
                                    borderColor: bothActiveToday ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                                    backgroundImage: bothActiveToday ? 'linear-gradient(to right, #c3f400, #ff4b89)' : 'none',
                                    color: bothActiveToday ? 'black' : accentColor
                                }}
                            >
                                {motivationalMessage.title}
                            </span>
                            {isUsingLocalStorage && (
                                <span className="border border-amber-500/30 text-amber-500 bg-amber-500/5 px-2 py-0.5 text-[7px] font-black tracking-widest uppercase rounded-none font-mono">
                                    LOCAL_SANDBOX_ACTIVE
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-bold text-white/90 uppercase tracking-tight leading-relaxed font-mono">
                            {motivationalMessage.text}
                        </p>
                        <p className="text-[10px] text-[#a88a7e] font-sans">
                            Priorizando consistencia sobre intensidad. El descanso y la recuperación forman parte de tu progreso operativo.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:flex-wrap sm:items-center">
                        {/* Streak Box */}
                        <div className="border border-white/10 bg-[#070707] p-4 text-center min-w-0 w-full sm:min-w-[120px] relative rounded-none">
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#c3f400]" style={{ backgroundColor: accentColor }} />
                            <Flame
                                className="w-5 h-5 mx-auto mb-1 animate-pulse stroke-[1.5]"
                                style={{ color: bothActiveToday ? 'url(#syncGrad)' : accentColor }}
                            />
                            <div className="text-3xl font-black font-mono tracking-tight tabular-nums text-white">
                                {syncStreak}
                            </div>
                            <div className="text-[7px] font-black uppercase tracking-[0.2em] text-[#a88a7e] mt-1">
                                SYNC_STREAK
                            </div>
                        </div>

                        {/* Combined Weekly Metrics */}
                        <div className="border border-white/10 bg-[#070707] p-4 min-w-0 w-full sm:min-w-[200px] flex-1 lg:flex-none rounded-none">
                            <div className="flex justify-between items-center text-[8px] font-bold text-[#a88a7e] uppercase tracking-wider mb-2">
                                <span>Progreso Semanal</span>
                                <span className="font-mono tabular-nums text-white">{weeklyStats.totalCompleted}/7 Sesiones</span>
                            </div>
                            {renderChunkedBar(weeklyStats.goalProgressPercentage, bothActiveToday ? '#ff4b89' : accentColor)}

                            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[8px] uppercase font-bold text-[#a88a7e]">
                                <div>
                                    <span className="text-[6px] block text-white/40">DÍAS ACTIVOS</span>
                                    <span className="text-white font-mono font-black text-xs tabular-nums">{weeklyStats.activeDaysCount}d / 7d</span>
                                </div>
                                <div>
                                    <span className="text-[6px] block text-white/40">DESCANSOS</span>
                                    <span className="text-white font-mono font-black text-xs tabular-nums">{weeklyStats.recoveryDays}d</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEEDBACK FLOATER ON ACTION SUBMITTED */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border text-black text-center text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 relative z-50 rounded-none"
                        style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    >
                        <Zap className="w-4 h-4 fill-black stroke-[1.5]" />
                        {feedbackMessage}
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
}
