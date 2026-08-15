import { motion } from 'framer-motion';

interface PomodoroDisplayProps {
    mode: 'work' | 'break';
    isRunning: boolean;
    timeLeft: number;
    elapsedSeconds: number;
    currentSessionDuration: number;
    progressPercent: number;
    formatTime: (seconds: number) => string;
    accentHex: string;
}

export function PomodoroDisplay({
    mode,
    isRunning,
    timeLeft,
    elapsedSeconds,
    currentSessionDuration,
    progressPercent,
    formatTime,
    accentHex
}: PomodoroDisplayProps) {
    return (
        <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-[9px] uppercase font-bold tracking-[0.25em]" style={{ color: mode === 'work' ? accentHex : '#00dbe9' }}>
                    {mode === 'work' ? 'TIEMPO RESTANTE DE ENFOQUE' : 'PAUSA DE DESCANSO'}
                </span>
            </div>

            {/* Massive Countdown */}
            <div className="relative flex items-center justify-center">
                <motion.div
                    animate={isRunning ? { scale: [1, 1.015, 1] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="font-mono text-6xl sm:text-8xl md:text-9xl font-black tracking-tight tabular-nums select-none"
                    style={{
                        color: mode === 'work' ? accentHex : '#00dbe9',
                        textShadow: isRunning
                            ? `0 0 40px ${mode === 'work' ? accentHex : '#00dbe9'}40`
                            : 'none'
                    }}
                >
                    {formatTime(timeLeft)}
                </motion.div>
            </div>

            {/* High-Tech Progress Bar */}
            <div className="space-y-1.5 pt-1 max-w-lg mx-auto">
                <div className="flex items-center justify-between text-[8px] font-mono text-[#a88a7e]">
                    <span>INICIO ({formatTime(elapsedSeconds)})</span>
                    <span className="font-black text-white">{Math.round(progressPercent)}%</span>
                    <span>META ({currentSessionDuration}:00)</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-none overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: mode === 'work' ? accentHex : '#00dbe9',
                            boxShadow: `0 0 10px ${mode === 'work' ? accentHex : '#00dbe9'}`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
