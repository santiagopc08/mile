import { Play, Pause, SkipForward, Maximize2, RotateCcw } from 'lucide-react';

interface PomodoroControlsProps {
    isRunning: boolean;
    isSessionActive: boolean;
    accentHex: string;
    handleStart: () => void;
    handlePause: () => void;
    handleSkip: () => void;
    handleReset: () => void;
    setIsFullscreen: (full: boolean) => void;
}

export function PomodoroControls({
    isRunning,
    isSessionActive,
    accentHex,
    handleStart,
    handlePause,
    handleSkip,
    handleReset,
    setIsFullscreen
}: PomodoroControlsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
                onClick={isRunning ? handlePause : handleStart}
                className={`group relative flex-1 flex h-12 items-center justify-center gap-2.5 border font-mono transition-all duration-300 active:scale-[0.98] ${
                    isRunning
                    ? 'border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.12]'
                    : 'border-white/30 text-black font-black hover:opacity-90 shadow-lg'
                }`}
                style={{
                    backgroundColor: isRunning ? undefined : accentHex,
                    borderColor: isRunning ? undefined : accentHex,
                    boxShadow: isRunning ? undefined : `0 0 20px -4px ${accentHex}`
                }}
            >
                {isRunning ? (
                    <>
                        <Pause size={14} fill="currentColor" />
                        <span className="text-[10px] font-black tracking-[0.2em] font-mono">PAUSAR MISIÓN</span>
                    </>
                ) : (
                    <>
                        <Play size={14} fill="currentColor" />
                        <span className="text-[10px] font-black tracking-[0.2em] font-mono">
                            {isSessionActive ? 'CONTINUAR ENFOQUE' : 'INICIAR SESIÓN DE ENFOQUE'}
                        </span>
                    </>
                )}
            </button>

            {isRunning && (
                <button
                    onClick={handleSkip}
                    className="flex h-12 px-3.5 items-center justify-center gap-1.5 border border-white/15 bg-black/40 text-[#a88a7e] hover:text-white hover:border-white/30 transition-all font-mono text-[9px] uppercase tracking-wider"
                    title="Saltar al siguiente bloque"
                >
                    <SkipForward size={14} />
                    <span className="hidden sm:inline">Saltar</span>
                </button>
            )}

            <button
                onClick={() => setIsFullscreen(true)}
                className="flex h-12 w-12 items-center justify-center border border-white/15 bg-black/40 text-[#a88a7e] hover:text-white hover:border-white/30 transition-all"
                title="Pantalla completa"
            >
                <Maximize2 size={16} />
            </button>

            {isSessionActive && (
                <button
                    onClick={handleReset}
                    className="flex h-12 w-12 items-center justify-center border border-red-500/20 bg-black/40 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500 transition-all"
                    title="Reiniciar misión"
                >
                    <RotateCcw size={16} />
                </button>
            )}
        </div>
    );
}
