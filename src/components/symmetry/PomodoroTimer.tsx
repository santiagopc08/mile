'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Play, 
    Pause, 
    RotateCcw, 
    Coffee, 
    Focus, 
    ChevronDown, 
    Check, 
    Maximize2, 
    Minimize2, 
    Sparkles, 
    Zap, 
    Flame, 
    Shield, 
    CheckCircle2, 
    ListTodo, 
    SkipForward, 
    Clock, 
    SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Task } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { haptics } from '@/lib/haptics';
import { sound } from '@/lib/sound';

const FOCUS_DURATION = 25; // default base work chunk
const BREAK_DURATION = 5;  // default base break chunk

const PRESETS = [
    { label: 'Sprint', duration: 15, icon: Zap, detail: '15 min sprint' },
    { label: 'Clásico', duration: 25, icon: Focus, detail: '25 min pomodoro' },
    { label: 'Profundo', duration: 45, icon: Flame, detail: '45 min deep work' },
    { label: 'Extendido', duration: 90, icon: Shield, detail: '90 min ultradiano' },
];

export function PomodoroTimer() {
    const [mounted, setMounted] = useState(false);
    const [totalBudget, setTotalBudget] = useState(25);
    const [currentSession, setCurrentSession] = useState(1);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentHex = profile === 'ella' ? '#ff4b89' : '#c3f400';

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, updateData } = useStore();
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { tasks, activeTask } = useMemo(() => {
        const filteredTasks: Task[] = [];
        let foundActiveTask: Task | undefined;

        const dataTasks = data?.tasks || [];
        for (let i = 0; i < dataTasks.length; i++) {
            const t = dataTasks[i];
            if (t.status !== 'done' && t.status !== 'skipped') {
                filteredTasks.push(t);
                if (selectedTaskId && t.id === selectedTaskId) {
                    foundActiveTask = t;
                }
            }
        }
        return { tasks: filteredTasks, activeTask: foundActiveTask };
    }, [data?.tasks, selectedTaskId]);

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
            haptics.triggerSuccess();
            sound.playSuccess();

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
        }
    };

    const handlePause = async () => {
        if (isRunning) {
            haptics.triggerTick();
            sound.playTick();
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
        haptics.triggerSuccess();
        sound.playSave();
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

    const handleSkip = async () => {
        haptics.triggerTick();
        sound.playTick();
        await handleComplete();
    };

    const handleReset = () => {
        haptics.triggerTick();
        sound.playTick();
        setIsRunning(false);
        setMode('work');
        setCurrentSession(1);
        setTimeLeft(sessionPlan[0].duration * 60);
        setElapsedSeconds(0);
        setIsFullscreen(false);
    };

    const handleExitFullscreen = async () => {
        haptics.triggerTick();
        setIsFullscreen(false);
    };

    const updateBudget = (mins: number) => {
        haptics.triggerTick();
        sound.playTick();
        const val = Math.max(5, Math.min(180, mins));
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
        haptics.triggerTick();
        sound.playTick();

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
    const progressPercent = Math.min(100, Math.max(0, (1 - timeLeft / (activeDuration * 60)) * 100));

    return (
        <div className="w-full font-mono text-[#e5e2e1] space-y-5 max-w-2xl mx-auto">
            
            {/* Header Telemetry Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        {isRunning && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: mode === 'work' ? accentHex : '#00dbe9' }} />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? '' : 'opacity-40'}`} style={{ backgroundColor: mode === 'work' ? accentHex : '#00dbe9' }} />
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: mode === 'work' ? accentHex : '#00dbe9' }}>
                        {isRunning ? (mode === 'work' ? 'ENFOQUE ACTIVO // EN CURSO' : 'DESCANSO REPARADOR') : (isSessionActive ? 'SESIÓN PAUSADA' : 'CONFIGURADOR DE MISIÓN')}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[8px] tracking-widest text-[#a88a7e]">
                    <span>BLOQUE {currentSession} / {totalSessions}</span>
                    <span className="text-white/20">•</span>
                    <span>TOTAL: {totalBudget} MIN</span>
                </div>
            </div>

            {/* Task Attachment Pill / Selector */}
            <div className="relative">
                <div className="flex items-center justify-between mb-1.5 text-[8px] uppercase tracking-[0.2em] text-[#a88a7e]">
                    <span>OBJETIVO VINCULADO</span>
                    {selectedTaskId && (
                        <button 
                            onClick={() => setSelectedTaskId('')} 
                            disabled={isRunning}
                            className="text-[7.5px] text-red-400/80 hover:text-red-400 uppercase tracking-widest disabled:opacity-30"
                        >
                            [ Desvincular ]
                        </button>
                    )}
                </div>
                <button
                    onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isRunning}
                    className={`flex min-h-[46px] w-full items-center justify-between border px-4 py-2.5 transition-all text-left ${
                        selectedTaskId 
                            ? 'border-white/25 bg-white/[0.05] shadow-inner' 
                            : 'border-white/10 bg-black/40 hover:border-white/20'
                    } disabled:opacity-50`}
                    style={{ borderColor: selectedTaskId ? accentHex : undefined }}
                >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ListTodo className="h-4 w-4 shrink-0" style={{ color: selectedTaskId ? accentHex : '#a88a7e' }} />
                        <span className={`truncate text-xs font-bold uppercase tracking-wide ${selectedTaskId ? 'text-white' : 'text-[#a88a7e]'}`}>
                            {selectedTaskId ? activeTask?.text : 'Vincular una tarea de tu lista...'}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`text-[#a88a7e] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isDropdownOpen && !isRunning && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto border border-white/15 bg-[#0e0a10] shadow-2xl backdrop-blur-2xl custom-scrollbar divide-y divide-white/5"
                        >
                            {tasks.length === 0 ? (
                                <div className="p-4 text-center text-[10px] text-[#a88a7e]">
                                    No hay tareas pendientes en tu lista.
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => { 
                                            setSelectedTaskId(task.id); 
                                            setIsDropdownOpen(false); 
                                            haptics.triggerTick();
                                        }}
                                        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/10 group"
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <span className="block font-bold truncate text-white text-[11px] uppercase group-hover:text-white">
                                                {task.text}
                                            </span>
                                            <span className="block text-[8px] text-[#a88a7e] tracking-wider mt-0.5 font-sans">
                                                {task.category || 'General'} • {task.actual_time || 0}m invertidos
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono font-bold text-white/30 group-hover:text-white shrink-0">
                                            [ SELECCIONAR ]
                                        </span>
                                    </button>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MAIN CORE: Displays Digital Clock & Reactor when running/active, or Presets Configurator when idle */}
            <div className="relative border border-white/12 bg-black/40 backdrop-blur-xl p-5 sm:p-7 overflow-hidden">
                <AnimatedBrutalistCorners color={mode === 'work' ? accentHex : '#00dbe9'} size={10} />

                {/* Digital Big Clock Reactor */}
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

                {/* Tactical Session Map Timeline */}
                <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-[#a88a7e]">
                        <span>MAPA DE SESIONES ({sessionPlan.length} BLOQUES)</span>
                        <span>{totalBudget} MIN TOTAL</span>
                    </div>

                    <div className="flex h-6 w-full border border-white/15 bg-black/60 overflow-hidden relative font-mono select-none">
                        {sessionPlan.map((session, i) => {
                            const pct = (session.duration / totalPlannedDuration) * 100;
                            const isCompleted = i + 1 < currentSession;
                            const isCurrent = i + 1 === currentSession;
                            const progressPct = isCurrent ? (elapsedSeconds / (session.duration * 60)) * 100 : 0;
                            
                            const colorClass = session.type === 'work' ? 'bg-user-a' : 'bg-user-c';
                            const blockColor = session.type === 'work' ? accentHex : '#00dbe9';

                            return (
                                <div 
                                    key={i} 
                                    className="h-full border-r border-white/10 last:border-r-0 flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                                    style={{ 
                                        width: `${pct}%`,
                                        backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.08)' : (isCurrent ? 'rgba(0, 0, 0, 0.4)' : undefined)
                                    }}
                                    title={`${session.type === 'work' ? 'Enfoque' : 'Descanso'}: ${session.duration} min`}
                                >
                                    {/* Unfinished background */}
                                    {!isCompleted && !isCurrent && (
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: blockColor }} />
                                    )}

                                    {/* Completed solid fill */}
                                    {isCompleted && (
                                        <div className="absolute inset-0 opacity-80" style={{ backgroundColor: blockColor }} />
                                    )}

                                    {/* Active live progress */}
                                    {isCurrent && (
                                        <div 
                                            className="absolute inset-y-0 left-0" 
                                            style={{ 
                                                width: `${progressPct}%`,
                                                backgroundColor: blockColor 
                                            }}
                                        />
                                    )}

                                    <span className={`relative z-10 text-[8px] font-mono leading-none flex items-center gap-1 ${isCompleted || isCurrent ? 'text-black font-black' : 'text-[#a88a7e]'}`}>
                                        {session.type === 'work' ? <Focus size={8} /> : <Coffee size={8} />}
                                        <span className="hidden sm:inline">{session.duration}m</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Idle Mode: Quick Presets & Time Budget Adjuster */}
                {!isRunning && (
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
                                const Icon = p.icon;

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
                        {showConfig && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-white/[0.02] border border-white/10 space-y-2 pt-3"
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
                    </div>
                )}

                {/* Active Attached Task Checklists (Interactive During Session) */}
                {selectedTaskId && activeTask && (activeTask.actions?.length || activeTask.validations?.length) ? (
                    <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                            <span>CHECKLIST DE ACCIONES DE LA TAREA</span>
                            <span className="text-white/40">INTERACTIVO</span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {activeTask.actions && activeTask.actions.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#ffb595] block">
                                        Acciones
                                    </span>
                                    {activeTask.actions.map(act => (
                                        <button
                                            key={act.id}
                                            onClick={() => toggleTaskChecklist(activeTask.id, 'actions', act.id)}
                                            className={`flex w-full items-center gap-2 border p-2 text-left text-[9.5px] transition-all ${
                                                act.checked 
                                                    ? 'border-white/10 bg-white/[0.02] text-white/40' 
                                                    : 'border-white/15 bg-white/[0.04] text-white hover:border-white/30'
                                            }`}
                                        >
                                            <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${act.checked ? 'border-user-a bg-user-a text-black' : 'border-white/30'}`}>
                                                {act.checked && <Check size={8} strokeWidth={4} />}
                                            </div>
                                            <span className={`truncate ${act.checked ? 'line-through' : ''}`}>
                                                {act.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTask.validations && activeTask.validations.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#00dbe9] block">
                                        Criterios de éxito
                                    </span>
                                    {activeTask.validations.map(val => (
                                        <button
                                            key={val.id}
                                            onClick={() => toggleTaskChecklist(activeTask.id, 'validations', val.id)}
                                            className={`flex w-full items-center gap-2 border p-2 text-left text-[9.5px] transition-all ${
                                                val.checked 
                                                    ? 'border-white/10 bg-white/[0.02] text-white/40' 
                                                    : 'border-white/15 bg-white/[0.04] text-white hover:border-white/30'
                                            }`}
                                        >
                                            <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${val.checked ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-white/30'}`}>
                                                {val.checked && <Check size={8} strokeWidth={4} />}
                                            </div>
                                            <span className={`truncate ${val.checked ? 'line-through' : ''}`}>
                                                {val.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Master Action Controls */}
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

            {/* FULLSCREEN IMMERSIVE ZEN HUD */}
            {mounted && typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isFullscreen && (
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
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
