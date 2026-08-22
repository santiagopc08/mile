import { Brutalist3DButton } from '@/components/ui/Brutalist3DButton';
import { Undo2, Trophy, RotateCcw, Lightbulb, Volume2, VolumeX, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import MahjongTimer from '../../MahjongTimer';

interface MahjongHudProps {
    hasStarted: boolean;
    timerActive: boolean;
    formatTime: (seconds: number) => string;
    timerRef: any;
    accentColor: string;
    streakCombo: number;
    streakTimeRemaining: number;
    isMatchPulse: boolean;
    matchedCount: number;
    tilesLength: number;
    handleUndo: () => void;
    undoStackLength: number;
    handleHint: () => void;
    gameMode: string;
    handleRestart: () => void;
    toggleMute: () => void;
    muted: boolean;
}

export function MahjongHud({
    hasStarted,
    timerActive,
    formatTime,
    timerRef,
    accentColor,
    streakCombo,
    streakTimeRemaining,
    isMatchPulse,
    matchedCount,
    tilesLength,
    handleUndo,
    undoStackLength,
    handleHint,
    gameMode,
    handleRestart,
    toggleMute,
    muted
}: MahjongHudProps) {
    return (
        <>
            {/* --- 3D BRUTALIST HUD: TIMER (TOP LEFT OF DOCK) --- */}
            <div className={`absolute ${hasStarted ? 'top-[calc(env(safe-area-inset-top,0px)+12px)]' : 'top-[16px] md:top-[24px]'} right-[calc(50%+90px)] sm:right-[calc(50%+110px)] md:right-[calc(50%+155px)] left-auto z-20`}>
                <MahjongTimer isActive={timerActive} formatTime={formatTime} ref={timerRef} accentColor={accentColor} />
            </div>

            {/* --- 3D BRUTALIST HUD: PAIR COUNTER (TOP RIGHT OF DOCK) --- */}
            <div className={`absolute ${hasStarted ? 'top-[calc(env(safe-area-inset-top,0px)+12px)]' : 'top-[16px] md:top-[24px]'} left-[calc(50%+90px)] sm:left-[calc(50%+110px)] md:left-[calc(50%+155px)] right-auto z-20 select-none group`}>
                {/* Remaining fire countdown timer */}
                {streakCombo > 0 && (
                    <div className="absolute -top-[24px] left-0 right-0 text-center font-mono text-[9px] font-black text-orange-500 animate-pulse bg-black/90 border border-orange-500/40 px-1 py-0.5 shadow-[0_0_8px_rgba(255,80,0,0.3)] rounded-sm">
                        🔥 {streakTimeRemaining}s
                    </div>
                )}
                {/* 3D shadow/extrusion */}
                <div
                    className="absolute inset-0 translate-x-[3px] translate-y-[3px] border-2 border-black transition-all duration-200"
                    style={{ backgroundColor: streakCombo > 0 ? '#ff4500' : accentColor }}
                />
                {/* Foreground container */}
                <div
                    className={`relative flex items-center gap-1.5 md:gap-2 border-2 bg-[#0a0a0a] px-2 py-1 md:px-3.5 md:py-2 transition-all duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] ${
                        isMatchPulse ? 'scale-105' : 'scale-100'
                    }`}
                    style={{
                        borderColor: streakCombo > 0 ? '#ff4500' : '#ffffff',
                        boxShadow: streakCombo > 0
                            ? '0 0 15px rgba(255, 69, 0, 0.4)'
                            : isMatchPulse
                                ? `0 0 15px ${accentColor}80`
                                : 'none'
                    }}
                >
                    {/* Glowing/pulsing Flame icon next to the number */}
                    {streakCombo > 0 && (
                        <motion.div
                            key={streakCombo}
                            initial={{ scale: 2.8, rotate: -18 }}
                            animate={{ scale: [1.18, 0.96, 1.08], rotate: [-8, 8, -4] }}
                            transition={{ duration: 0.9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            className="relative mr-0.5 text-orange-500"
                        >
                            <span className="absolute inset-0 rounded-full bg-orange-500/45 blur-md" />
                            {Array.from({ length: Math.min(5, Math.max(1, streakCombo)) }).map((_, idx) => (
                                <motion.span
                                    key={idx}
                                    className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-yellow-300"
                                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                                    animate={{
                                        x: (idx - 2) * 5,
                                        y: [-2, -13 - idx * 2],
                                        opacity: [0, 0.95, 0],
                                        scale: [0.5, 1.1, 0.25]
                                    }}
                                    transition={{
                                        duration: 0.7 + idx * 0.08,
                                        repeat: Infinity,
                                        delay: idx * 0.1,
                                        ease: 'easeOut'
                                    }}
                                />
                            ))}
                            <Flame
                                className="relative h-4 w-4 md:h-5 md:w-5 fill-orange-500 text-orange-500 drop-shadow-[0_0_8px_rgba(255,106,0,0.85)]"
                                style={{
                                    filter: `drop-shadow(0 0 ${Math.min(14, 6 + streakCombo * 1.3)}px rgba(255,106,0,0.9))`
                                }}
                            />
                        </motion.div>
                    )}
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-[#a88a7e] mb-0.5">Parejas</span>
                        <div className="flex items-baseline gap-1 font-mono tracking-normal">
                            <motion.span
                                key={Math.floor(matchedCount / 2)}
                                initial={{ scale: 3.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                className="inline-block text-xs md:text-sm font-black tabular-nums text-white"
                                style={{ transformOrigin: "center" }}
                            >
                                {Math.floor(matchedCount / 2)}
                            </motion.span>
                            <span className="text-[9px] md:text-[10px] text-white/40">/ {Math.floor(tilesLength / 2)}</span>
                        </div>
                    </div>
                    <Trophy
                        className={`h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-300 ${isMatchPulse ? 'rotate-12 scale-125' : 'rotate-0'}`}
                        style={{ color: streakCombo > 0 ? '#ff4500' : accentColor }}
                    />
                </div>
            </div>

            {/* --- 3D BRUTALIST HUD: ACTIONS (BOTTOM CENTER, BELOW PROGRESS BAR) --- */}
            <div className={`absolute ${hasStarted ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] md:bottom-[24px]' : 'bottom-[calc(var(--app-nav-height)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-[16px]'} left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 sm:gap-4`}>
                <Brutalist3DButton
                    onClick={handleUndo}
                    disabled={undoStackLength === 0}
                    shadowColor={undoStackLength > 0 ? accentColor : '#333'}
                    title="Deshacer"
                >
                    <Undo2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-45" />
                    <span className="hidden sm:inline">Deshacer</span>
                </Brutalist3DButton>

                <Brutalist3DButton onClick={handleHint} shadowColor={accentColor} title="Pista">
                    <Lightbulb className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-115 group-hover:text-yellow-300" />
                    <span className="hidden sm:inline">Pista</span>
                </Brutalist3DButton>

                {gameMode !== 'daily' && (
                    <Brutalist3DButton onClick={handleRestart} shadowColor={accentColor} title="Reiniciar">
                        <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
                        <span className="hidden sm:inline">Reiniciar</span>
                    </Brutalist3DButton>
                )}

                <Brutalist3DButton
                    onClick={toggleMute}
                    shadowColor={muted ? '#555' : accentColor}
                    title={muted ? 'Activar sonido' : 'Silenciar'}
                    aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                >
                    {muted
                        ? <VolumeX className="h-3.5 w-3.5 text-white/50" />
                        : <Volume2 className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-115" />}
                    <span className="hidden sm:inline">{muted ? 'Silencio' : 'Sonido'}</span>
                </Brutalist3DButton>
            </div>
        </>
    );
}
