import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipForward, RotateCcw, Minimize2, Check } from 'lucide-react';
import { Task } from '@/services/storeService';

interface PomodoroFullscreenProps {
    isFullscreen: boolean;
    isRunning: boolean;
    mode: 'work' | 'break';
    currentSession: number;
    totalSessions: number;
    timeLeft: number;
    elapsedSeconds: number;
    currentSessionDuration: number;
    progressPercent: number;
    selectedTaskId: string;
    activeTask: Task | undefined;
    accentHex: string;
    formatTime: (seconds: number) => string;
    handleStart: () => void;
    handlePause: () => void;
    handleSkip: () => void;
    handleReset: () => void;
    handleExitFullscreen: () => void;
    toggleTaskChecklist: (taskId: string, listType: 'actions' | 'validations', itemId: string) => Promise<void>;
}

export function PomodoroFullscreen({
    isFullscreen,
    isRunning,
    mode,
    currentSession,
    totalSessions,
    timeLeft,
    elapsedSeconds,
    currentSessionDuration,
    progressPercent,
    selectedTaskId,
    activeTask,
    accentHex,
    formatTime,
    handleStart,
    handlePause,
    handleSkip,
    handleReset,
    handleExitFullscreen,
    toggleTaskChecklist
}: PomodoroFullscreenProps) {
    if (!isFullscreen || typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070509]/98 p-6 backdrop-blur-2xl"
            >
                {/* Radial Neon Atmospheric Ambient */}
                <div
                    className="absolute inset-0 -z-10 opacity-25 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 50% 50%, ${mode === 'work' ? accentHex : '#00dbe9'} 0%, transparent 70%)`
                    }}
                />

                <div className="w-full max-w-4xl space-y-10">
                    {/* Top Bar */}
                    <div className="flex w-full items-end justify-between border-b border-white/10 pb-4">
                        <div className="space-y-1">
                            <div className="text-[11px] font-mono font-black tracking-[0.3em] uppercase flex items-center gap-2" style={{ color: mode === 'work' ? accentHex : '#00dbe9' }}>
                                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: mode === 'work' ? accentHex : '#00dbe9' }} />
                                <span>{mode === 'work' ? 'MODO ENFOQUE TOTAL // EN CURSO' : 'MODO DESCANSO // RECARGA'}</span>
                            </div>
                            <div className="text-[9px] font-mono tracking-[0.2em] text-[#a88a7e]">
                                Bloque {currentSession} de {totalSessions} • {selectedTaskId ? activeTask?.text : 'Enfoque Libre'}
                            </div>
                        </div>
                        <button
                            onClick={handleExitFullscreen}
                            className="p-2 border border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/30 transition-colors"
                            title="Salir de pantalla completa"
                        >
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    {/* Giant Digital Core Counter */}
                    <div className="relative text-center space-y-6">
                        <motion.div
                            animate={isRunning ? { scale: [1, 1.015, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="font-mono text-[110px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tight tabular-nums select-none"
                            style={{
                                color: mode === 'work' ? accentHex : '#00dbe9',
                                textShadow: `0 0 80px ${mode === 'work' ? accentHex : '#00dbe9'}40`
                            }}
                        >
                            {formatTime(timeLeft)}
                        </motion.div>

                        {/* Progress Bar in Fullscreen */}
                        <div className="max-w-xl mx-auto space-y-2">
                            <div className="flex items-center justify-between font-mono text-[9px] text-[#a88a7e]">
                                <span>{formatTime(elapsedSeconds)} TRANSCURRIDO</span>
                                <span className="font-bold text-white">{Math.round(progressPercent)}%</span>
                                <span>{currentSessionDuration}:00 META</span>
                            </div>
                            <div className="h-3 w-full bg-white/10 rounded-none overflow-hidden p-0.5 border border-white/15">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: mode === 'work' ? accentHex : '#00dbe9',
                                        boxShadow: `0 0 15px ${mode === 'work' ? accentHex : '#00dbe9'}`
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fullscreen Checklist Section */}
                    {selectedTaskId && activeTask && (activeTask.actions?.length || activeTask.validations?.length) ? (
                        <div className="mx-auto max-w-2xl space-y-4 pt-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {activeTask.actions && activeTask.actions.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#ffb595] block">
                                            Acciones requeridas
                                        </span>
                                        <div className="space-y-1.5">
                                            {activeTask.actions.map(act => (
                                                <button
                                                    key={act.id}
                                                    onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)}
                                                    className={`flex w-full items-center gap-2.5 border p-2.5 text-left text-[11px] font-mono transition-all ${
                                                        act.checked
                                                            ? 'border-white/10 bg-white/[0.02] text-white/30'
                                                            : 'border-white/20 bg-white/[0.05] text-white hover:border-white/40'
                                                    }`}
                                                >
                                                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center border ${act.checked ? 'border-user-a bg-user-a text-black' : 'border-white/30'}`}>
                                                        {act.checked && <Check size={10} strokeWidth={4} />}
                                                    </div>
                                                    <span className={`truncate ${act.checked ? 'line-through' : ''}`}>
                                                        {act.text}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTask.validations && activeTask.validations.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00dbe9] block">
                                            Criterios de éxito
                                        </span>
                                        <div className="space-y-1.5">
                                            {activeTask.validations.map(val => (
                                                <button
                                                    key={val.id}
                                                    onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)}
                                                    className={`flex w-full items-center gap-2.5 border p-2.5 text-left text-[11px] font-mono transition-all ${
                                                        val.checked
                                                            ? 'border-white/10 bg-white/[0.02] text-white/30'
                                                            : 'border-white/20 bg-white/[0.05] text-white hover:border-white/40'
                                                    }`}
                                                >
                                                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center border ${val.checked ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-white/30'}`}>
                                                        {val.checked && <Check size={10} strokeWidth={4} />}
                                                    </div>
                                                    <span className={`truncate ${val.checked ? 'line-through' : ''}`}>
                                                        {val.text}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Fullscreen Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-6">
                        <button
                            onClick={isRunning ? handlePause : handleStart}
                            className="flex h-14 items-center justify-center gap-3 border px-10 text-[11px] font-black uppercase tracking-[0.25em] transition-all font-mono active:scale-95"
                            style={{
                                backgroundColor: isRunning ? 'rgba(255,255,255,0.08)' : (mode === 'work' ? accentHex : '#00dbe9'),
                                borderColor: isRunning ? 'rgba(255,255,255,0.2)' : (mode === 'work' ? accentHex : '#00dbe9'),
                                color: isRunning ? '#ffffff' : '#000000',
                                boxShadow: isRunning ? undefined : `0 0 25px -4px ${mode === 'work' ? accentHex : '#00dbe9'}`
                            }}
                        >
                            {isRunning ? <><Pause size={18} fill="currentColor" /> PAUSAR</> : <><Play size={18} fill="currentColor" /> CONTINUAR</>}
                        </button>

                        {isRunning && (
                            <button
                                onClick={handleSkip}
                                className="flex h-14 px-6 items-center justify-center gap-2 border border-white/20 bg-black/40 text-white/80 hover:text-white hover:border-white/40 transition-all font-mono text-[10px] uppercase tracking-widest"
                            >
                                <SkipForward size={16} />
                                <span>SALTAR BLOQUE</span>
                            </button>
                        )}

                        <button
                            onClick={handleReset}
                            className="flex h-14 w-14 items-center justify-center border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black transition-all font-mono"
                            title="Reiniciar"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
