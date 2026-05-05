'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus, Target, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';

interface Task {
    id: string;
    text: string;
    status: string;
    actions?: { id: string, text: string, checked: boolean }[];
    validations?: { id: string, text: string, checked: boolean }[];
}

const FOCUS_DURATION = 25; // minutes
const BREAK_DURATION = 5;  // minutes

export function PomodoroTimer() {
    const [totalBudget, setTotalBudget] = useState(25);
    const [currentSession, setCurrentSession] = useState(1);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const { data, updateData } = useStore();
    const tasks = useMemo(() => {
        return (data?.tasks || []).filter((t: Task) => t.status !== 'done' && t.status !== 'skipped');
    }, [data?.tasks]);

    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Compute sessions from total budget
    const sessionPlan = useMemo(() => {
        const fullSessions = Math.floor(totalBudget / FOCUS_DURATION);
        const remainder = totalBudget % FOCUS_DURATION;
        const sessions: number[] = [];

        for (let i = 0; i < fullSessions; i++) {
            sessions.push(FOCUS_DURATION);
        }
        if (remainder > 0) {
            sessions.push(remainder);
        }
        if (sessions.length === 0) {
            sessions.push(totalBudget || 1);
        }

        return sessions;
    }, [totalBudget]);

    const totalSessions = sessionPlan.length;
    const currentSessionDuration = sessionPlan[Math.min(currentSession - 1, sessionPlan.length - 1)];

    // Removed fetchTasks effect as we now use global store data

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

    // Reset timer when budget or session changes (only when not running)
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
                const task = tasks.find(t => t.id === selectedTaskId);
                if (task && task.status === 'todo') {
                    try {
                        const updatedTasks = (data?.tasks || []).map((t: any) =>
                            t.id === selectedTaskId ? { ...t, status: 'in_progress', updated_at: new Date().toISOString() } : t
                        );
                        await updateData({ tasks: updatedTasks as any });
                    } catch (e) {
                        console.error("Failed to update status", e);
                    }
                }
            }

            setIsRunning(true);
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
                const updatedTasks = (data?.tasks || []).map((t: any) => {
                    if (t.id === selectedTaskId) {
                        return { ...t, actual_time: (t.actual_time || 0) + minutesToDeposit, updated_at: new Date().toISOString() };
                    }
                    return t;
                });
                await updateData({ tasks: updatedTasks as any });
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

        if (mode === 'work') {
            // Check if there are more sessions
            if (currentSession < totalSessions) {
                // Go to break
                setMode('break');
                setTimeLeft(BREAK_DURATION * 60);
                setElapsedSeconds(0);
            } else {
                // All sessions done — reset fully
                setMode('work');
                setCurrentSession(1);
                setTimeLeft(sessionPlan[0] * 60);
                setElapsedSeconds(0);
            }
        } else {
            // Break finished → advance to next focus session
            const nextSession = currentSession + 1;
            setCurrentSession(nextSession);
            setMode('work');
            setTimeLeft(sessionPlan[Math.min(nextSession - 1, sessionPlan.length - 1)] * 60);
            setElapsedSeconds(0);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setMode('work');
        setCurrentSession(1);
        setTimeLeft(sessionPlan[0] * 60);
        setElapsedSeconds(0);
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

        const updatedTasks = data.tasks.map(t => {
            if (t.id === taskId) {
                const list = (t[listType] || []) as any[];
                const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
                return { ...t, [listType]: newList };
            }
            return t;
        });

        try {
            await updateData({ tasks: updatedTasks as any });
        } catch (e) {
            console.error("Failed to update checklist", e);
        }
    };

    const activeDuration = mode === 'work' ? currentSessionDuration : BREAK_DURATION;
    const progress = 1 - (timeLeft / (activeDuration * 60));

    return (
        <div className="flex w-full flex-col items-center justify-center border border-white/10 bg-black/40 p-4 font-mono text-[#e5e2e1] sm:p-6">


            <div className="w-full flex flex-col items-center">

                {isRunning && (
                    <div className="mb-4 flex w-full items-end justify-between border-b border-user-a/30 pb-2">
                        <div className="text-[10px] font-bold tracking-[0.2em] text-user-a">[ :: ACTIVE_SESSION ]<br /><span className="text-[#a88a7e]">SYS_SESSION_{currentSession.toString().padStart(2, '0')}</span></div>
                        <div className="text-right text-[8px] tracking-[0.2em] text-[#594137]">UPLINK: SECURE<br />LATENCY: 14MS</div>
                    </div>
                )}

                {/* Main Countdown */}
                <div className="relative my-6 w-full text-center">
                    <div className="mb-2 text-[8px] uppercase tracking-[0.3em] text-[#a88a7e]">
                        [ REMAINING_BLOCK_TIME ]
                    </div>
                    <div className="font-sans text-[92px] font-black leading-[0.85] tracking-normal tabular-nums sm:text-[140px]"
                        style={{
                            color: isRunning ? 'var(--color-user-a)' : '#e5e2e1',
                            textShadow: isRunning ? '0 0 40px rgba(255, 112, 32, 0.4)' : 'none'
                        }}>
                        {formatTime(timeLeft)}
                    </div>

                    {isRunning && (
                        <div className="w-full mt-6">
                            <div className="mb-1 flex justify-between text-[8px] tracking-[0.2em] text-[#a88a7e]">
                                <span>ELAPSED: {formatTime(elapsedSeconds)}</span>
                                <span>TARGET: {currentSessionDuration}:00</span>
                            </div>
                            <div className="h-2 w-full border border-white/10 bg-[#050505]">
                                <motion.div
                                    className="h-full"
                                    style={{
                                        width: `${(elapsedSeconds / (currentSessionDuration * 60)) * 100}%`,
                                        background: 'repeating-linear-gradient(to right, var(--color-user-a), var(--color-user-a) 3px, transparent 3px, transparent 5px)'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Budget Control - Hide when running */}
                {!isRunning && (
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#a88a7e]">
                            <span>Tiempo Total</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={totalBudget}
                                    onChange={(e) => updateBudget(parseInt(e.target.value) || 1)}
                                    disabled={isRunning}
                                    className="w-14 border-b border-white/10 bg-transparent py-1 text-center font-mono text-white outline-none focus:border-user-a disabled:opacity-50"
                                />
                                <span>Min</span>
                            </div>
                        </div>
                        <div className="py-2">
                            <input
                                type="range"
                                min="1"
                                max="180"
                                value={totalBudget}
                                onChange={(e) => updateBudget(parseInt(e.target.value))}
                                disabled={isRunning}
                                className="h-1.5 w-full cursor-pointer appearance-none bg-[#201f1f] accent-user-a disabled:opacity-50"
                            />
                        </div>
                        <div className="text-center font-mono text-[8px] text-[#a88a7e]">
                            {sessionPlan.map((d, i) => `${d}m`).join(' + ')} = {totalBudget}min de foco
                        </div>
                    </div>
                )}

                {/* Task Anchoring */}
                <div className="w-full relative mt-6 mb-2">
                    <div className="mb-2 text-[8px] uppercase tracking-[0.2em] text-[#a88a7e]">
                        {'>'} OPERATION_TARGET
                    </div>
                    <button
                        onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isRunning}
                        className="flex min-h-[50px] w-full items-center justify-between border border-white/10 bg-black p-4 transition-all hover:border-user-a disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`truncate text-[12px] font-bold uppercase tracking-widest ${selectedTaskId ? 'text-white' : 'text-[#594137]'}`}>
                                {selectedTaskId ? tasks.find(t => t.id === selectedTaskId)?.text : 'SELECT TASK...'}
                            </span>
                        </div>
                        {!isRunning && <ChevronDown size={14} className="text-[#a88a7e]" />}
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && !isRunning && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-48 overflow-y-auto border border-white/10 bg-[#0a0a0a] shadow-2xl custom-scrollbar"
                            >
                                <button
                                    onClick={() => { setSelectedTaskId(''); setIsDropdownOpen(false); }}
                                    className="min-h-[44px] w-full border-b border-white/5 p-3 text-left text-[10px] uppercase text-[#a88a7e] hover:bg-white/5"
                                >
                                    [ UNLINK TARGET ]
                                </button>
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => { setSelectedTaskId(task.id); setIsDropdownOpen(false); }}
                                        className="flex w-full flex-col gap-1 border-b border-white/5 p-3 text-left text-[10px] uppercase hover:bg-white/5"
                                    >
                                        <span className="font-bold truncate text-white">{task.text}</span>
                                        <span className="text-[8px] tracking-widest text-[#a88a7e]">STATUS: {task.status}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Execution Mode Checklists (Visible only when running and anchored) */}
                {isRunning && selectedTaskId && mode === 'work' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full space-y-4">
                        {(() => {
                            const activeTask = tasks.find(t => t.id === selectedTaskId);
                            if (!activeTask) return null;
                            const hasActions = activeTask.actions && activeTask.actions.length > 0;
                            const hasValidations = activeTask.validations && activeTask.validations.length > 0;
                            if (!hasActions && !hasValidations) return null;

                            return (
                                <div className="space-y-4 border-t border-white/10 pt-4">
                                    <div className="mb-2 text-center text-[8px] font-bold uppercase tracking-widest text-[#a88a7e]">Modo Ejecución</div>

                                    {hasActions && (
                                        <div className="space-y-2">
                                            <div className="text-[7px] uppercase font-bold text-user-b">Acciones</div>
                                            {activeTask.actions!.map(act => (
                                                <button key={act.id} onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)} className={`flex w-full items-center gap-2 border p-2 text-left text-[9px] transition-colors ${act.checked ? 'border-user-b/50 bg-user-b/10 opacity-50' : 'border-white/10 hover:border-user-b'}`}>
                                                    <div className={`w-3 h-3 flex items-center justify-center border ${act.checked ? 'border-user-b bg-user-b text-white' : 'border-stone-400'}`}>
                                                        {act.checked && <Check size={8} />}
                                                    </div>
                                                    <span className={act.checked ? 'line-through' : ''}>{act.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {hasValidations && (
                                        <div className="space-y-2">
                                            <div className="text-[7px] uppercase font-bold text-emerald-500">Validaciones</div>
                                            {activeTask.validations!.map(val => (
                                                <button key={val.id} onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)} className={`flex w-full items-center gap-2 border p-2 text-left text-[9px] transition-colors ${val.checked ? 'border-emerald-500/50 bg-emerald-500/10 opacity-50' : 'border-white/10 hover:border-emerald-500'}`}>
                                                    <div className={`w-3 h-3 flex items-center justify-center border ${val.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-400'}`}>
                                                        {val.checked && <Check size={8} />}
                                                    </div>
                                                    <span className={val.checked ? 'line-through' : ''}>{val.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </motion.div>
                )}

                {/* Controls */}
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        className="w-full mt-4 py-5 bg-user-a text-[#5c2000] text-[12px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-3 border border-user-a hover:bg-[#ffb595] transition-colors"
                        style={{ boxShadow: '0 0 20px rgba(255, 112, 32, 0.2)' }}
                    >
                        <Play size={16} fill="currentColor" /> [ START FOCUS ]
                    </button>
                ) : (
                    <div className="flex w-full gap-4 mt-6">
                        <button
                            onClick={handlePause}
                            className="flex-1 py-4 border border-white/20 bg-[#0a0a0a] text-stone-300 text-[10px] font-bold tracking-[0.2em] flex flex-col items-center justify-center gap-2 hover:border-white transition-colors"
                        >
                            <Pause size={16} /> [ || PAUSE ]
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 py-4 border border-white/20 bg-[#0a0a0a] text-stone-300 text-[10px] font-bold tracking-[0.2em] flex flex-col items-center justify-center gap-2 hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                            <RotateCcw size={16} /> [ (x) ABORT ]
                        </button>
                        <button
                            onClick={handleComplete}
                            className="flex-[2] py-4 bg-user-a text-[#5c2000] border border-user-a text-[10px] font-black tracking-[0.2em] flex flex-col items-center justify-center gap-2 hover:bg-[#ffb595] transition-colors"
                        >
                            <Check size={16} /> [ (v) COMPLETE EARLY ]
                        </button>
                    </div>
                )}

                {elapsedSeconds > 0 && selectedTaskId && (
                    <div className="text-[9px] uppercase font-bold tracking-widest text-user-a animate-pulse text-center">
                        {Math.floor(elapsedSeconds / 60)}m listos para inyectar al anclaje
                    </div>
                )}

            </div>
        </div>
    );
}
