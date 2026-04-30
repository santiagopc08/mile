'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus, Target, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreService, Task } from '@/services/storeService';

interface Task {
    id: string;
    text: string;
    status: string;
}

export function PomodoroTimer() {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [durationMinutes, setDurationMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            const store = await StoreService.getStore();
            setTasks(store.tasks.filter(t => t.status !== 'done'));
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        window.addEventListener('tasks-refresh', fetchTasks);
        return () => window.removeEventListener('tasks-refresh', fetchTasks);
    }, [fetchTasks]);

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

    const handleStart = async () => {
        if (!isRunning) {
            // Haptic Feedback
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(50);
            }

            // Auto-shift status if pending
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
                setElapsedSeconds(s => s % 60); // Keep remaining seconds
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

        const nextMode = mode === 'work' ? 'break' : 'work';
        const nextDuration = nextMode === 'work' ? 25 : 5;

        setMode(nextMode);
        setDurationMinutes(nextDuration);
        setTimeLeft(nextDuration * 60);
        setElapsedSeconds(0);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(durationMinutes * 60);
        setElapsedSeconds(0);
    };

    const updateDuration = (mins: number) => {
        const val = Math.max(1, Math.min(120, mins));
        setDurationMinutes(val);
        if (!isRunning) setTimeLeft(val * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = 1 - (timeLeft / (durationMinutes * 60));

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
                
                {/* Mode Selector */}
                <div className="flex border border-stone-200 dark:border-stone-800 p-1 bg-white/5">
                    <button 
                        onClick={() => { setMode('work'); updateDuration(25); }}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest transition-all ${mode === 'work' ? 'bg-user-a text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
                    >
                        <Focus size={14} /> Focus
                    </button>
                    <button 
                        onClick={() => { setMode('break'); updateDuration(5); }}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest transition-all ${mode === 'break' ? 'bg-user-a text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
                    >
                        <Coffee size={14} /> Break
                    </button>
                </div>

                {/* Main Countdown */}
                <div className="relative">
                    <div className="text-[80px] sm:text-[120px] leading-none font-black tracking-tighter text-stone-900 dark:text-white tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Duration Control */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-stone-400">
                        <span>Duración Manual</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={durationMinutes}
                                onChange={(e) => updateDuration(parseInt(e.target.value) || 1)}
                                className="w-12 bg-transparent border-b border-stone-200 dark:border-stone-800 text-center text-stone-900 dark:text-white focus:border-user-a outline-none py-1"
                            />
                            <span>Min</span>
                        </div>
                    </div>
                    <div className="py-2">
                        <input
                            type="range"
                            min="1"
                            max="120"
                            value={durationMinutes}
                            onChange={(e) => updateDuration(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 appearance-none cursor-pointer accent-user-a rounded-none"
                        />
                    </div>
                </div>

                {/* Task Anchoring */}
                <div className="w-full relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 min-h-[48px] border border-stone-200 dark:border-stone-800 bg-white/5 hover:border-user-a transition-all"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Target size={16} className={selectedTaskId ? 'text-user-a' : 'text-stone-400'} />
                            <span className="text-[10px] uppercase font-bold tracking-widest truncate">
                                {selectedTaskId ? tasks.find(t => t.id === selectedTaskId)?.text : 'Anclar a una operación'}
                            </span>
                        </div>
                        <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
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
