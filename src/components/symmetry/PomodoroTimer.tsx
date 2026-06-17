'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus, Target, ChevronDown, Check, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { StoreService, Task } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';

const FOCUS_DURATION = 25; // minutes
const BREAK_DURATION = 5;  // minutes

export function PomodoroTimer() {
    const [mounted, setMounted] = useState(false);
    const [totalBudget, setTotalBudget] = useState(25);
    const [currentSession, setCurrentSession] = useState(1);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, updateData } = useStore();
    const tasks = useMemo(() => {
        return (data?.tasks || []).filter((t: Task) => t.status !== 'done' && t.status !== 'skipped');
    }, [data?.tasks]);

    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const activeTask = useMemo(() => {
        return selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : undefined;
    }, [tasks, selectedTaskId]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const sessionPlan = useMemo(() => {
        const fullSessions = Math.floor(totalBudget / FOCUS_DURATION);
        const remainder = totalBudget % FOCUS_DURATION;
        const plan: { type: 'work' | 'break', duration: number }[] = [];

        for (let i = 0; i < fullSessions; i++) {
            plan.push({ type: 'work', duration: FOCUS_DURATION });
            if (i < fullSessions - 1 || remainder > 0) {
                plan.push({ type: 'break', duration: BREAK_DURATION });
            }
        }
        if (remainder > 0) {
            plan.push({ type: 'work', duration: remainder });
        }
        if (plan.length === 0) {
            plan.push({ type: 'work', duration: totalBudget || 1 });
        }

        return plan;
    }, [totalBudget]);

    // ⚡ Bolt Optimization: Calculate total duration once instead of O(N^2) inside sessionPlan.map
    const totalPlannedDuration = useMemo(() => {
        let sum = 0;
        for (const s of sessionPlan) {
            sum += s.duration;
        }
        return sum;
    }, [sessionPlan]);

    const totalSessions = sessionPlan.length;
    const currentSessionData = sessionPlan[Math.min(currentSession - 1, totalSessions - 1)];
    const currentSessionDuration = currentSessionData?.duration || FOCUS_DURATION;
    const isSessionActive = elapsedSeconds > 0 || currentSession > 1 || isRunning;

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(t => t - 1);
                setElapsedSeconds(s => s + 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            handleComplete();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, timeLeft]);

    const prevDurationRef = useRef(currentSessionDuration);
    useEffect(() => {
        if (!isRunning && prevDurationRef.current !== currentSessionDuration) {
            setTimeLeft(currentSessionDuration * 60);
            prevDurationRef.current = currentSessionDuration;
        }
    }, [currentSessionDuration, isRunning]);

    const handleStart = async () => {
        if (!isRunning) {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(50);
            }

            if (selectedTaskId) {
                const task = activeTask;
                if (task && task.status === 'todo') {
                    try {
                        const updatedTasks = (data?.tasks || []).map((t: Task): Task =>
                            t.id === selectedTaskId ? { ...t, status: 'in_progress', updated_at: new Date().toISOString() } : t
                        );
                        await updateData({ tasks: updatedTasks });
                    } catch (e) {
                        console.error("Failed to update status", e);
                    }
                }
            }

            setIsRunning(true);
            setIsFullscreen(true);
        }
    };

    const handlePause = async () => {
        if (isRunning) {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(30);
            }
            setIsRunning(false);
            await depositTime();
        }
    };

    const depositTime = async () => {
        const minutesToDeposit = Math.floor(elapsedSeconds / 60);
        if (minutesToDeposit > 0 && selectedTaskId) {
            try {
                const updatedTasks = (data?.tasks || []).map((t: Task) => {
                    if (t.id === selectedTaskId) {
                        return { ...t, actual_time: (t.actual_time || 0) + minutesToDeposit, updated_at: new Date().toISOString() };
                    }
                    return t;
                });
                await updateData({ tasks: updatedTasks });
                setElapsedSeconds(s => s % 60);
            } catch (e) {
                console.error("Failed to deposit time", e);
            }
        }
    };

    const handleComplete = async () => {
        setIsRunning(false);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        await depositTime();

        if (currentSession < totalSessions) {
            const nextIdx = currentSession; 
            const nextMode = sessionPlan[nextIdx].type;
            setCurrentSession(currentSession + 1);
            setMode(nextMode);
            setTimeLeft(sessionPlan[nextIdx].duration * 60);
            setElapsedSeconds(0);
        } else {
            setMode('work');
            setCurrentSession(1);
            setTimeLeft(sessionPlan[0].duration * 60);
            setElapsedSeconds(0);
            setIsFullscreen(false);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setMode('work');
        setCurrentSession(1);
        setTimeLeft(sessionPlan[0].duration * 60);
        setElapsedSeconds(0);
        setIsFullscreen(false);
    };

    const handleExitFullscreen = async () => {
        setIsRunning(false);
        
        // Calculate minutes worked in completed sessions
        let completedFocusMinutes = 0;
        for (let i = 0; i < currentSession - 1; i++) {
            if (sessionPlan[i]?.type === 'work') {
                completedFocusMinutes += sessionPlan[i].duration;
            }
        }
        
        // Calculate minutes worked in the current session
        let currentFocusMinutes = 0;
        if (mode === 'work') {
            currentFocusMinutes = Math.floor(elapsedSeconds / 60);
        }
        
        const totalMinutesWorked = completedFocusMinutes + currentFocusMinutes;
        
        // Calculate new budget
        const newBudget = Math.max(1, totalBudget - totalMinutesWorked);
        setTotalBudget(newBudget);
        
        // Deposit the elapsed minutes of the current session to the task
        await depositTime();
        
        // Compute new plan on the fly to get correct first session duration
        const nextPlan = (() => {
            const fullSessions = Math.floor(newBudget / FOCUS_DURATION);
            const remainder = newBudget % FOCUS_DURATION;
            const plan: { type: 'work' | 'break', duration: number }[] = [];

            for (let i = 0; i < fullSessions; i++) {
                plan.push({ type: 'work', duration: FOCUS_DURATION });
                if (i < fullSessions - 1 || remainder > 0) {
                    plan.push({ type: 'break', duration: BREAK_DURATION });
                }
            }
            if (remainder > 0) {
                plan.push({ type: 'work', duration: remainder });
            }
            if (plan.length === 0) {
                plan.push({ type: 'work', duration: newBudget || 1 });
            }
            return plan;
        })();
        
        setCurrentSession(1);
        setMode('work');
        setTimeLeft(nextPlan[0].duration * 60);
        setElapsedSeconds(0);
        setIsFullscreen(false);
    };

    const updateBudget = (mins: number) => {
        const val = Math.max(1, Math.min(180, mins));
        setTotalBudget(val);
        if (!isRunning) {
            setCurrentSession(1);
            setMode('work');
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTaskChecklist = async (taskId: string, listType: 'actions' | 'validations', itemId: string) => {
        if (!data?.tasks) return;

        const updatedTasks = data.tasks.map((t): Task => {
            if (t.id === taskId) {
                const list = (t[listType] || []) as any[];
                const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
                return { ...t, [listType]: newList };
            }
            return t;
        });

        try {
            await updateData({ tasks: updatedTasks });
        } catch (e) {
            console.error("Failed to update checklist", e);
        }
    };

    const activeDuration = mode === 'work' ? currentSessionDuration : BREAK_DURATION;
    const progress = 1 - (timeLeft / (activeDuration * 60));

    return (
        <div className="w-full font-mono text-[#e5e2e1] space-y-4 max-w-xl mx-auto">
            {/* Task Selection */}
            <div className="relative">
                <div className="mb-2 text-[8px] uppercase tracking-[0.2em] text-[#a88a7e]">
                    ¿En qué te vas a enfocar?
                </div>
                <button
                    onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isRunning}
                    className="flex min-h-[44px] w-full items-center justify-between border border-white/10 bg-black/40 px-4 py-2 transition-all hover:border-user-a disabled:opacity-50"
                >
                    <span className={`truncate text-[11px] font-bold uppercase tracking-widest ${selectedTaskId ? 'text-white' : 'text-[#594137]'}`}>
                        {selectedTaskId ? activeTask?.text : 'Elige una tarea...'}
                    </span>
                    <ChevronDown size={12} className="text-[#a88a7e]" />
                </button>

                <AnimatePresence>
                    {isDropdownOpen && !isRunning && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-48 overflow-y-auto border border-white/10 bg-[#0a0a0a] shadow-2xl custom-scrollbar"
                        >
                            {tasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => { setSelectedTaskId(task.id); setIsDropdownOpen(false); }}
                                    className="flex w-full flex-col gap-1 border-b border-white/5 p-3 text-left text-[10px] uppercase hover:bg-white/5"
                                >
                                    <span className="font-bold truncate text-white">{task.text}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Time Budget and Segmented Session Track */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-[#a88a7e]">
                    <span>Tiempo total de enfoque</span>
                    <div className="flex items-center gap-1 font-mono">
                        <input
                            type="number"
                            value={totalBudget}
                            onChange={(e) => setTotalBudget(Math.max(1, Math.min(180, parseInt(e.target.value) || 0)))}
                            disabled={isRunning}
                            className="w-10 bg-transparent text-right font-mono text-white outline-none focus:text-user-a border-b border-transparent focus:border-user-a/30"
                        />
                        <span>MIN</span>
                    </div>
                </div>

                <div className="relative pt-2">
                    {/* Proportional Segmented Session Timeline */}
                    <div className="flex h-5 w-full border border-white/10 bg-black/40 overflow-hidden relative font-mono select-none">
                        {sessionPlan.map((session, i) => {
                            const pct = (session.duration / totalPlannedDuration) * 100;
                            const isCompleted = i + 1 < currentSession;
                            const isActive = i + 1 === currentSession && isRunning;
                            const progressPct = isActive ? (elapsedSeconds / (session.duration * 60)) * 100 : 0;
                            
                            const colorClass = session.type === 'work' ? 'bg-user-a' : 'bg-user-c';
                            const textClass = session.type === 'work' ? 'text-black font-black' : 'text-black font-bold';

                            return (
                                <div 
                                    key={i} 
                                    className="h-full border-r border-white/10 last:border-r-0 flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                                    style={{ 
                                        width: `${pct}%`,
                                        backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.05)' : (isActive ? 'rgba(0, 0, 0, 0.3)' : undefined)
                                    }}
                                    title={`${session.type === 'work' ? 'Enfoque' : 'Descanso'}: ${session.duration} min`}
                                >
                                    {/* Static background for pending session */}
                                    {!isCompleted && !isActive && (
                                        <div className={`absolute inset-0 ${colorClass} opacity-20`} />
                                    )}

                                    {/* Completed solid block */}
                                    {isCompleted && (
                                        <div className={`absolute inset-0 ${colorClass} opacity-80`} />
                                    )}

                                    {/* Active progress fills */}
                                    {isActive && (
                                        <div 
                                            className={`absolute inset-y-0 left-0 ${colorClass}`} 
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    )}

                                    <span className={`relative z-10 text-[8px] font-mono leading-none flex items-center gap-1 ${isCompleted || isActive ? 'text-black font-black' : 'text-[#a88a7e]'}`}>
                                        {session.type === 'work' ? <Focus size={8} /> : <Coffee size={8} />}
                                        <span className="hidden xs:inline">{session.duration}m</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(parseInt(e.target.value))}
                        disabled={isRunning}
                        className="w-full h-1 mt-2 cursor-pointer appearance-none bg-white/5 accent-user-a disabled:opacity-50"
                    />
                </div>

                <div className="flex items-center justify-between mt-1">
                    <span className="text-[7px] font-black tracking-widest text-[#594137] uppercase font-mono">
                        Sesión {currentSession} de {totalSessions}
                    </span>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex gap-2 w-full pt-2">
                <button
                    onClick={isRunning ? handlePause : handleStart}
                    className={`group relative flex-1 flex h-11 items-center justify-center gap-2 border font-mono transition-all disabled:opacity-50 ${
                        isRunning 
                        ? 'border-white/20 bg-white/5 text-[#a88a7e] hover:text-white' 
                        : 'border-user-a bg-user-a/5 text-user-a hover:bg-user-a hover:text-black'
                    }`}
                >
                    <span className="text-[9px] font-black tracking-[0.2em] font-mono">
                        {isRunning ? 'PAUSAR' : (isSessionActive ? 'CONTINUAR' : 'EMPEZAR')}
                    </span>
                    {isRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    
                    {!isRunning && (
                        <>
                            <div className="absolute -right-1 -top-1 h-2 w-2 border-r border-t border-user-a" />
                            <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b border-l border-user-a" />
                        </>
                    )}
                </button>

                {isRunning && (
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="flex h-11 w-11 items-center justify-center border border-white/10 bg-black/40 text-[#a88a7e] hover:text-white hover:bg-white/5 transition-colors"
                        title="Ver en pantalla completa"
                    >
                        <Maximize2 size={14} />
                    </button>
                )}

                {isSessionActive && (
                    <button
                        onClick={handleReset}
                        className="flex h-11 w-11 items-center justify-center border border-red-500/20 bg-black/40 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500 transition-colors"
                        title="Reiniciar"
                    >
                        <RotateCcw size={14} />
                    </button>
                )}
            </div>

            {/* FULLSCREEN SESSION MODAL */}
            {mounted && typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isFullscreen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-xl"
                        >
                            <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--color-user-a) 0%, transparent 70%)' }} />

                            <div className="w-full max-w-4xl space-y-12">
                                {/* Header Status */}
                                <div className="flex w-full items-end justify-between border-b border-white/10 pb-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black tracking-[0.3em] text-user-a uppercase">
                                            {mode === 'work' ? 'Tiempo de Enfoque' : 'Tiempo de Descanso'}
                                        </div>
                                        <div className="text-[8px] tracking-[0.2em] text-[#a88a7e]">
                                            Sesión {currentSession} de {totalSessions} • {selectedTaskId ? activeTask?.text : 'Enfoque general'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleExitFullscreen}
                                        className="p-2 text-white/40 hover:text-white transition-colors"
                                    >
                                        <Minimize2 size={20} />
                                    </button>
                                </div>

                                {/* Big Countdown */}
                                <div className="relative text-center">
                                    <motion.div
                                        animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="font-mono text-[120px] font-black leading-none tracking-tighter tabular-nums sm:text-[200px]"
                                        style={{
                                            color: mode === 'work' ? 'var(--color-user-a)' : 'var(--color-user-c)',
                                            textShadow: mode === 'work' ? '0 0 60px rgba(255, 112, 32, 0.3)' : '0 0 60px rgba(0, 219, 233, 0.3)'
                                        }}
                                    >
                                        {formatTime(timeLeft)}
                                    </motion.div>

                                    {/* Progress Bar */}
                                    <div className="mt-8 flex items-center gap-4">
                                        <span className="text-[8px] text-stone-600 tabular-nums">{formatTime(elapsedSeconds)}</span>
                                        <div className="flex-1">
                                            <FuturisticProgressBar 
                                                progress={(elapsedSeconds / (currentSessionDuration * 60)) * 100} 
                                                color={mode === 'work' ? 'var(--color-user-a)' : 'var(--color-user-c)'}
                                            />
                                        </div>
                                        <span className="text-[8px] text-stone-600 tabular-nums">{currentSessionDuration}:00</span>
                                    </div>
                                </div>

                                {/* Checklist Section */}
                                {selectedTaskId && mode === 'work' && (
                                    <div className="mx-auto max-w-2xl space-y-6">
                                        {(() => {
                                            if (!activeTask) return null;
                                            const hasActions = activeTask.actions && activeTask.actions.length > 0;
                                            const hasValidations = activeTask.validations && activeTask.validations.length > 0;

                                            return (
                                                <div className="grid gap-6 sm:grid-cols-2">
                                                    {hasActions && (
                                                        <div className="space-y-3">
                                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#ffb595]">Tareas a realizar</div>
                                                            <div className="space-y-1.5">
                                                                {activeTask.actions!.map(act => (
                                                                    <button key={act.id} onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)} className={`flex w-full items-center gap-3 border p-3 text-left text-[10px] transition-all ${act.checked ? 'border-user-a/20 bg-user-a/5 text-stone-500' : 'border-white/10 hover:border-user-a text-white'}`}>
                                                                        <div className={`flex h-4 w-4 items-center justify-center border ${act.checked ? 'border-user-a bg-user-a text-black' : 'border-white/20'}`}>
                                                                            {act.checked && <Check size={10} strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={act.checked ? 'line-through' : ''}>{act.text}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {hasValidations && (
                                                        <div className="space-y-3">
                                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-user-c">Criterios para terminar</div>
                                                            <div className="space-y-1.5">
                                                                {activeTask.validations!.map(val => (
                                                                    <button key={val.id} onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)} className={`flex w-full items-center gap-3 border p-3 text-left text-[10px] transition-all ${val.checked ? 'border-user-c/20 bg-user-c/5 text-stone-500' : 'border-white/10 hover:border-user-c text-white'}`}>
                                                                        <div className={`flex h-4 w-4 items-center justify-center border ${val.checked ? 'border-user-c bg-user-c text-black' : 'border-white/20'}`}>
                                                                            {val.checked && <Check size={10} strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={val.checked ? 'line-through' : ''}>{val.text}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Session Controls */}
                                <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-8">
                                    <button
                                        onClick={isRunning ? handlePause : handleStart}
                                        className={`flex h-20 items-center justify-center gap-3 border px-12 text-[12px] font-black uppercase tracking-[0.3em] transition-all font-mono ${isRunning ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' : (mode === 'work' ? 'border-user-a bg-user-a text-black hover:bg-[#ffb595]' : 'border-user-c bg-user-c text-black hover:bg-[#a8ffff]')}`}
                                    >
                                        {isRunning ? <><Pause size={20} fill="currentColor" /> PAUSAR</> : <><Play size={20} fill="currentColor" /> CONTINUAR</>}
                                    </button>

                                    <button
                                        onClick={handleReset}
                                        className="flex h-20 w-20 items-center justify-center border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black transition-all font-mono"
                                    >
                                        <RotateCcw size={24} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
