import { useState, useEffect, useRef, useMemo } from 'react';
import { Task } from '@/services/storeService';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { haptics } from '@/lib/haptics';
import { sound } from '@/lib/sound';

export const FOCUS_DURATION = 25; // default base work chunk
export const BREAK_DURATION = 5;  // default base break chunk

export const PRESETS = [
    { label: 'Sprint', duration: 15, icon: 'Zap', detail: '15 min sprint' },
    { label: 'Clásico', duration: 25, icon: 'Focus', detail: '25 min pomodoro' },
    { label: 'Profundo', duration: 45, icon: 'Flame', detail: '45 min deep work' },
    { label: 'Extendido', duration: 90, icon: 'Shield', detail: '90 min ultradiano' },
];

export function usePomodoroTimer() {
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
    }, [isRunning, timeLeft, handleComplete]); // eslint-disable-line react-hooks/exhaustive-deps

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

    return {
        mounted,
        totalBudget,
        currentSession,
        mode,
        timeLeft,
        isRunning,
        elapsedSeconds,
        isFullscreen,
        setIsFullscreen,
        showConfig,
        setShowConfig,
        accentColor,
        accentHex,
        selectedTaskId,
        setSelectedTaskId,
        isDropdownOpen,
        setIsDropdownOpen,
        tasks,
        activeTask,
        sessionPlan,
        totalPlannedDuration,
        totalSessions,
        currentSessionDuration,
        isSessionActive,
        handleStart,
        handlePause,
        handleSkip,
        handleReset,
        handleExitFullscreen,
        updateBudget,
        formatTime,
        toggleTaskChecklist,
        progressPercent
    };
}
