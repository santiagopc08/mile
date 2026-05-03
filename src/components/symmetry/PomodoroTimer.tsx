'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus, Target, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';

interface Task {
    id: string;
    text: string;
    status: string;
    actions?: {id: string, text: string, checked: boolean}[];
    validations?: {id: string, text: string, checked: boolean}[];
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

    const { data } = useStore();
    const tasks = useMemo(() => {
        return (data?.tasks || []).filter((t: Task) => t.status !== 'done');
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
    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(currentSessionDuration * 60);
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
                        await StoreService.updateTaskStatus(selectedTaskId, 'in_progress');
                        window.dispatchEvent(new CustomEvent('tasks-refresh'));
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
                await StoreService.updateTaskActualTime(selectedTaskId, minutesToDeposit);
                setElapsedSeconds(s => s % 60);
                window.dispatchEvent(new CustomEvent('tasks-refresh'));
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
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const list = task[listType] || [];
        const newList = list.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
        
        // Update via store service (partial update)
        try {
            await StoreService.updateStore({
                tasks: [{ ...task, [listType]: newList }] as any
            });
            window.dispatchEvent(new CustomEvent('tasks-refresh'));
        } catch (e) {
            console.error("Failed to update checklist", e);
        }
    };

    const activeDuration = mode === 'work' ? currentSessionDuration : BREAK_DURATION;
    const progress = 1 - (timeLeft / (activeDuration * 60));

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4 bg-mosaic bg-opacity-[0.03] sm:p-6">

            {/* Linear Mosaic Border Progress */}
            <div className="fixed inset-0 pointer-events-none z-50">
                {/* Top */}
                <motion.div
                    className="absolute top-0 left-0 h-1 bg-user-a"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(1, progress * 4) * 100}%` }}
                />
                {/* Right */}
                <motion.div
                    className="absolute top-0 right-0 w-1 bg-user-a"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(0, Math.min(1, (progress - 0.25) * 4)) * 100}%` }}
                />
                {/* Bottom */}
                <motion.div
                    className="absolute bottom-0 right-0 h-1 bg-user-a"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(1, (progress - 0.5) * 4)) * 100}%` }}
                />
                {/* Left */}
                <motion.div
                    className="absolute bottom-0 left-0 w-1 bg-user-a"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(0, Math.min(1, (progress - 0.75) * 4)) * 100}%` }}
                />
            </div>

            <div className="w-full max-w-sm flex flex-col items-center space-y-6 sm:space-y-8">
                
                {/* Mode Indicator */}
                <div className="flex border border-stone-200 dark:border-stone-800 p-1 bg-white/5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest transition-all ${mode === 'work' ? 'bg-user-a text-white' : 'text-stone-500'}`}>
                        <Focus size={14} /> Focus
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest transition-all ${mode === 'break' ? 'bg-user-a text-white' : 'text-stone-500'}`}>
                        <Coffee size={14} /> Break
                    </div>
                </div>

                {/* Session Progress */}
                {totalSessions > 1 && (
                    <div className="w-full flex items-center justify-center gap-2">
                        {sessionPlan.map((dur, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex flex-col items-center`}>
                                    <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-mono font-bold border transition-all ${
                                        i + 1 < currentSession
                                            ? 'bg-user-a border-user-a text-white'
                                            : i + 1 === currentSession
                                                ? 'border-user-a text-user-a'
                                                : 'border-stone-300 dark:border-stone-700 text-stone-400'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <span className="text-[7px] font-mono text-stone-400 mt-1">{dur}m</span>
                                </div>
                                {i < sessionPlan.length - 1 && (
                                    <div className={`w-4 h-px mt-[-8px] ${i + 1 < currentSession ? 'bg-user-a' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Countdown */}
                <div className="relative">
                    <div className="text-[80px] sm:text-[120px] leading-none font-bold tracking-tighter text-stone-900 dark:text-white tabular-nums font-mono">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-center text-[9px] uppercase font-bold tracking-[0.3em] text-stone-400 mt-2">
                        Sesión {currentSession}/{totalSessions} · {currentSessionDuration}min {mode === 'break' ? '(Descanso)' : ''}
                    </div>
                </div>

                {/* Budget Control - Hide when running */}
                {!isRunning && (
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-stone-400">
                            <span>Tiempo Total</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={totalBudget}
                                    onChange={(e) => updateBudget(parseInt(e.target.value) || 1)}
                                    disabled={isRunning}
                                    className="w-14 bg-transparent border-b border-stone-200 dark:border-stone-800 text-center text-stone-900 dark:text-white focus:border-user-a outline-none py-1 font-mono disabled:opacity-50"
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
                                className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 appearance-none cursor-pointer accent-user-a rounded-none disabled:opacity-50"
                            />
                        </div>
                        <div className="text-[8px] text-center font-mono text-stone-500">
                            {sessionPlan.map((d, i) => `${d}m`).join(' + ')} = {totalBudget}min de foco
                        </div>
                    </div>
                )}

                {/* Task Anchoring */}
                <div className="w-full relative">
                    <button
                        onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isRunning}
                        className="w-full flex items-center justify-between p-3 min-h-[48px] border border-stone-200 dark:border-stone-800 bg-white/5 hover:border-user-a transition-all disabled:opacity-80 disabled:hover:border-stone-200 dark:disabled:hover:border-stone-800"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Target size={16} className={selectedTaskId ? 'text-user-a' : 'text-stone-400'} />
                            <span className="text-[10px] uppercase font-bold tracking-widest truncate">
                                {selectedTaskId ? tasks.find(t => t.id === selectedTaskId)?.text : 'Anclar a una operación'}
                            </span>
                        </div>
                        {!isRunning && <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && !isRunning && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 z-[60] max-h-48 overflow-y-auto custom-scrollbar shadow-xl"
                            >
                                <button
                                    onClick={() => { setSelectedTaskId(''); setIsDropdownOpen(false); }}
                                    className="w-full text-left p-3 text-[10px] uppercase hover:bg-stone-50 dark:hover:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800/50 min-h-[44px]"
                                >
                                    Sin anclaje
                                </button>
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => { setSelectedTaskId(task.id); setIsDropdownOpen(false); }}
                                        className="w-full text-left p-3 text-[10px] uppercase hover:bg-stone-50 dark:hover:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800/50 flex flex-col min-h-[48px]"
                                    >
                                        <span className="font-bold truncate">{task.text}</span>
                                        <span className="text-[8px] text-stone-400 uppercase tracking-tighter">{task.status}</span>
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
                                <div className="space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">
                                    <div className="text-[8px] uppercase font-bold tracking-widest text-stone-400 text-center mb-2">Modo Ejecución</div>
                                    
                                    {hasActions && (
                                        <div className="space-y-2">
                                            <div className="text-[7px] uppercase font-bold text-user-b">Acciones</div>
                                            {activeTask.actions!.map(act => (
                                                <button key={act.id} onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)} className={`w-full flex items-center gap-2 p-2 text-left text-[9px] border transition-colors ${act.checked ? 'border-user-b/50 bg-user-b/10 opacity-50' : 'border-stone-200 dark:border-stone-800 hover:border-user-b'}`}>
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
                                                <button key={val.id} onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)} className={`w-full flex items-center gap-2 p-2 text-left text-[9px] border transition-colors ${val.checked ? 'border-emerald-500/50 bg-emerald-500/10 opacity-50' : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500'}`}>
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
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                    <button 
                        onClick={handleReset}
                        className="p-4 sm:p-5 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-all bg-white/5 active:bg-stone-100 dark:active:bg-stone-800"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button 
                        onClick={isRunning ? handlePause : handleStart}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 sm:py-5 text-[12px] uppercase font-black tracking-[0.3em] transition-all min-h-[56px] ${
                            isRunning 
                                ? 'bg-stone-900 text-white border border-stone-900 dark:bg-white dark:text-black dark:border-white'
                                : 'bg-user-a text-white border border-user-a shadow-[4px_4px_0px_0px_rgba(249,115,22,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                        }`}
                    >
                        {isRunning ? <><Pause size={20} fill="currentColor" /> Pause</> : <><Play size={20} fill="currentColor" /> Start</>}
                    </button>
                </div>

                {elapsedSeconds > 0 && selectedTaskId && (
                    <div className="text-[9px] uppercase font-bold tracking-widest text-user-a animate-pulse text-center">
                        {Math.floor(elapsedSeconds / 60)}m listos para inyectar al anclaje
                    </div>
                )}

            </div>
        </div>
    );
}
