'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';
import { NotificationService } from '@/services/notificationService';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

import { SharedStatusHeader } from './movement/SharedStatusHeader';
import { DualUserPanels } from './movement/DualUserPanels';
import { QuickLogForm } from './movement/QuickLogForm';
import { ProgressAnalytics } from './movement/ProgressAnalytics';
import { ActivityHistory } from './movement/ActivityHistory';

import {
    SessionCategory,
    DifficultyLevel,
    EnergyLevel,
    CompletionStatus,
    MobilityStatus,
    ReactionType,
    Reaction,
    MovementSession
} from './movement/types';

import {
    Award, TrendingDown, Check,
    Plus, AlertCircle, Trash2, HelpCircle
} from 'lucide-react';

import { CATEGORY_LABELS, PRESETS_EL, PRESETS_ELLA, REACTION_CONFIG } from './movement/constants';

export function MovementTracker() {
    const { profile } = useProfile();
    const isElla = profile === 'ella';
    
    // Core styling based on currently logged user
    const accentColor = isElla ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = isElla ? 'user-a' : 'user-b';
    const partnerClass = isElla ? 'user-b' : 'user-a';
    const partnerColor = isElla ? 'var(--color-user-b)' : 'var(--color-user-a)';
    
    // Core State
    const [sessions, setSessions] = useState<MovementSession[]>([]);
    const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Logging Form State
    const [sessionType, setSessionType] = useState<SessionCategory>(isElla ? 'strength' : 'physical_therapy');
    const [duration, setDuration] = useState<number | ''>(30);
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
    const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('completed');
    const [notes, setNotes] = useState('');
    
    // Therapy-Specific Form State
    const [painBefore, setPainBefore] = useState<number | ''>('');
    const [painAfter, setPainAfter] = useState<number | ''>('');
    const [fatigueLevel, setFatigueLevel] = useState<number | ''>('');
    const [mobilityStatus, setMobilityStatus] = useState<MobilityStatus>('normal');
    const [therapistNotes, setTherapistNotes] = useState('');
    
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [showTherapyFields, setShowTherapyFields] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Category Updates based on profile & selected session type
    useEffect(() => {
        const config = CATEGORY_LABELS[sessionType];
        setShowTherapyFields(config ? config.isTherapy : false);
    }, [sessionType]);

    // Set default category on user toggle
    useEffect(() => {
        setSessionType(isElla ? 'strength' : 'physical_therapy');
    }, [isElla]);

    // Secure ID generator
    const generateId = () => {
        return crypto.randomUUID();
    };

    // Load data from Supabase or LocalStorage
    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('movement_sessions')
                .select('*')
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Format incoming rows if needed
            const formatted = (data || []).map((row: any) => ({
                ...row,
                reactions: Array.isArray(row.reactions) ? row.reactions : []
            }));
            
            setSessions(formatted);
            setIsUsingLocalStorage(false);
        } catch (err) {
            console.warn('Supabase not available for movement_sessions, fetching from LocalStorage.', err);
            const local = localStorage.getItem('movement_sessions');
            if (local) {
                setSessions(JSON.parse(local));
            } else {
                setSessions([]);
            }
            setIsUsingLocalStorage(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Sincronización en tiempo real o almacenamiento local al guardar
    const handleLogSession = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!duration || duration <= 0) return;
        if (!profile) return;

        setIsSubmitting(true);
        const todayStr = new Date().toISOString().split('T')[0];

        const sessionPayload: Omit<MovementSession, 'id' | 'reactions' | 'created_at'> = {
            profile: profile as 'el' | 'ella',
            date: todayStr,
            session_type: sessionType,
            duration: Number(duration),
            difficulty,
            energy_level: energyLevel,
            notes: notes.trim() || undefined,
            completion_status: completionStatus,
            pain_before: showTherapyFields && painBefore !== '' ? Number(painBefore) : undefined,
            pain_after: showTherapyFields && painAfter !== '' ? Number(painAfter) : undefined,
            fatigue_level: showTherapyFields && fatigueLevel !== '' ? Number(fatigueLevel) : undefined,
            mobility_status: showTherapyFields ? mobilityStatus : undefined,
            therapist_notes: showTherapyFields && therapistNotes.trim() ? therapistNotes.trim() : undefined
        };

        let message = 'SESSION_LOGGED';
        if (showTherapyFields) {
            message = 'RECOVERY_PROGRESS_UPDATED';
        } else if (completionStatus === 'completed' && Number(duration) >= 30) {
            message = 'DAILY_TARGET_COMPLETED';
        }

        try {
            if (!isUsingLocalStorage) {
                const { error } = await supabase
                    .from('movement_sessions')
                    .insert({
                        ...sessionPayload,
                        reactions: []
                    });
                if (error) throw error;
                await fetchSessions();
            } else {
                const local = localStorage.getItem('movement_sessions');
                const existing = local ? JSON.parse(local) : [];
                const newObj: MovementSession = {
                    ...sessionPayload,
                    id: generateId(),
                    reactions: [],
                    created_at: new Date().toISOString()
                };
                const updated = [newObj, ...existing];
                localStorage.setItem('movement_sessions', JSON.stringify(updated));
                setSessions(updated);
            }

            // Enviar notificación a la pareja
            const partner = profile === 'el' ? 'ella' : 'el';
            const whoName = profile === 'el' ? 'Él' : 'Ella';
            const sessionName = CATEGORY_LABELS[sessionType]?.label || sessionType;
            let noteMsg = `${whoName} completó una sesión de ${sessionName} (${duration} min)`;
            if (completionStatus === 'recovery') {
                noteMsg = `${whoName} registró un día de recuperación activa (${sessionName}, ${duration} min)`;
            } else if (completionStatus === 'rest_day') {
                noteMsg = `${whoName} registró un día de descanso operativo`;
            }

            NotificationService.addNotification(partner, 'movement', noteMsg).catch(err => {
                console.error('Failed to trigger movement notification', err);
            });

            // Si la pareja también completó sesión hoy, enviar notificación de Sincronía
            const hasPartnerLogged = sessions.some(s => s.profile === partner && s.date === todayStr && s.completion_status === 'completed');
            if (hasPartnerLogged && completionStatus === 'completed') {
                const syncMsg = `¡Sincronía de Movimiento Completada! Ambos están activos hoy.`;
                NotificationService.addNotification(partner, 'movement_sync', syncMsg).catch(err => {
                    console.error('Failed to trigger sync notification', err);
                });
            }

            // Success feedback
            sound.playSave();
            haptics.triggerSave();
            setFeedbackMessage(message);
            setTimeout(() => setFeedbackMessage(null), 3000);

            // Reset inputs
            setDuration(30);
            setNotes('');
            setPainBefore('');
            setPainAfter('');
            setFatigueLevel('');
            setTherapistNotes('');
            setCompletionStatus('completed');
        } catch (err) {
            console.error('Failed to log movement session', err);
            sound.playError();
            haptics.triggerError();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Load Quick Preset
    const applyPreset = (preset: typeof PRESETS_EL[0]) => {
        setSessionType(preset.session_type);
        setDuration(preset.duration);
        setDifficulty(preset.difficulty);
        setEnergyLevel(preset.energy_level);
        setCompletionStatus(preset.completion_status);
        setNotes(preset.notes || '');
        if (preset.pain_before !== undefined) setPainBefore(preset.pain_before);
        if (preset.pain_after !== undefined) setPainAfter(preset.pain_after);
        if (preset.fatigue_level !== undefined) setFatigueLevel(preset.fatigue_level);
        if (preset.mobility_status !== undefined) setMobilityStatus(preset.mobility_status);
        if (preset.therapist_notes !== undefined) setTherapistNotes(preset.therapist_notes);
    };

    // Delete Session
    const handleDeleteSession = async (id: string) => {
        try {
            if (!isUsingLocalStorage) {
                const { error } = await supabase.from('movement_sessions').delete().eq('id', id);
                if (error) throw error;
                await fetchSessions();
            } else {
                // ⚡ Bolt Optimization: Replace findIndex+splice mutation with single-pass filter
                const updated = sessions.filter(s => s.id !== id);
                localStorage.setItem('movement_sessions', JSON.stringify(updated));
                setSessions(updated);
            }
        } catch (err) {
            console.error('Failed to delete session', err);
        }
    };

    // Log Support Reaction
    const handleAddReaction = async (sessionId: string, rxType: ReactionType) => {
        if (!profile) return;
        // ⚡ Bolt Optimization: Replace O(N) double pass (.find + .findIndex) with single pass
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return;
        const targetSession = sessions[sessionIndex];

        const newRx: Reaction = {
            reactor: profile as 'el' | 'ella',
            type: rxType,
            timestamp: new Date().toISOString()
        };

        // Update existing reaction or append a new one to avoid duplicates
        const updatedReactions = [...targetSession.reactions];
        const existingIdx = updatedReactions.findIndex(r => r.reactor === profile);
        if (existingIdx !== -1) {
            updatedReactions[existingIdx] = newRx;
        } else {
            updatedReactions.push(newRx);
        }

        try {
            if (!isUsingLocalStorage) {
                const { error } = await supabase
                    .from('movement_sessions')
                    .update({ reactions: updatedReactions })
                    .eq('id', sessionId);
                if (error) throw error;
                await fetchSessions();
            } else {
                const updated = [...sessions];
                updated[sessionIndex] = { ...targetSession, reactions: updatedReactions };
                localStorage.setItem('movement_sessions', JSON.stringify(updated));
                setSessions(updated);
            }
            sound.playSave();
            haptics.triggerSave();
        } catch (err) {
            console.error('Failed to add support reaction', err);
            sound.playError();
            haptics.triggerError();
        }
    };

    // --- Derived Metrics & Logic ---

    // Sessions logged today by each user
    const todayStr = new Date().toISOString().split('T')[0];

    const { activeElToday, activeEllaToday } = useMemo(() => {
        let el = false;
        let ella = false;

        // ⚡ Bolt Optimization: Single O(N) pass replacing multiple .filter() and .some() calls
        for (const s of sessions) {
            if (s.date === todayStr) {
                if (s.profile === 'el') el = true;
                if (s.profile === 'ella') ella = true;

                // Early exit if both are found
                if (el && ella) break;
            }
        }

        return { activeElToday: el, activeEllaToday: ella };
    }, [sessions, todayStr]);

    // Glow Dual Triggered when BOTH are active today!
    const bothActiveToday = activeElToday && activeEllaToday;

    // SYNC_STREAK Calculator: consecutive days where at least one or both logged activity.
    const syncStreak = useMemo(() => {
        if (sessions.length === 0) return 0;

        // Group sessions by unique date strings
        const datesWithActivity = new Set<string>();
        for (const s of sessions) {
            datesWithActivity.add(s.date);
        }
        
        let streak = 0;
        let checkDate = new Date(); // Start with today

        // If no activity today, check if yesterday had one to maintain streak
        const todayStr = checkDate.toISOString().split('T')[0];
        const yesterday = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (!datesWithActivity.has(todayStr) && !datesWithActivity.has(yesterdayStr)) {
            return 0; // Streak broken
        }

        // If today has no activity but yesterday did, start tracking from yesterday
        if (!datesWithActivity.has(todayStr) && datesWithActivity.has(yesterdayStr)) {
            checkDate = yesterday;
        }

        // Loop backwards to count consecutive days
        while (true) {
            const dateKey = checkDate.toISOString().split('T')[0];
            if (datesWithActivity.has(dateKey)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }, [sessions]);

    // Weekly stats (sessions completed, active days, progress)
    const weeklyStats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let elSessions = 0;
        let ellaSessions = 0;
        let totalCompleted = 0;
        let recoveryDays = 0;
        const activeDates = new Set<string>();
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

        // ⚡ Bolt Optimization: Replace multiple .filter() and .map() with single pass O(N) loop
        for (const s of sessions) {
            if (s.date >= startOfWeekStr) {
                totalCompleted++;
                if (s.profile === 'el') elSessions++;
                else if (s.profile === 'ella') ellaSessions++;

                activeDates.add(s.date);

                if (s.completion_status === 'recovery' || s.completion_status === 'rest_day') {
                    recoveryDays++;
                }
            }
        }
        
        const activeDaysCount = activeDates.size;
        
        // Target: Combined 7 sessions a week
        const combinedTarget = 7;
        const goalProgressPercentage = Math.min(100, Math.round((totalCompleted / combinedTarget) * 100));

        return {
            elSessions,
            ellaSessions,
            totalCompleted,
            activeDaysCount,
            goalProgressPercentage,
            recoveryDays
        };
    }, [sessions]);

    // Dynamic Motivational Message
    const motivationalMessage = useMemo(() => {
        if (bothActiveToday) {
            return {
                title: 'SYNC_COMPLETE',
                text: 'Ambos sistemas activos hoy. Sincronía del 100% en movimiento.'
            };
        }
        if (activeElToday || activeEllaToday) {
            const who = activeElToday ? 'Él' : 'Ella';
            return {
                title: 'MOVEMENT_LOGGED_SUCCESS',
                text: `${who} registró actividad física hoy. Manteniendo la racha en progreso.`
            };
        }
        return {
            title: 'CONSISTENCY_BUILDS_RECOVERY',
            text: 'La constancia diaria es la base de la rehabilitación y la fuerza. Inicia hoy.'
        };
    }, [bothActiveToday, activeElToday, activeEllaToday]);

    // Interactive preset lists based on current profile
    const currentPresets = isElla ? PRESETS_ELLA : PRESETS_EL;

    // Helper to render chunked progress bars (Brutalist Chunked Progress)
    const renderChunkedBar = (percentage: number, color: string) => {
        const totalChunks = 10;
        const activeChunks = Math.round((percentage / 100) * totalChunks);
        
        return (
            <div className="flex gap-1 w-full mt-2">
                {Array.from({ length: totalChunks }).map((_, index) => {
                    const isActive = index < activeChunks;
                    return (
                        <div 
                            key={index} 
                            className="h-3 flex-1 border border-white/10 transition-all duration-300"
                            style={{ 
                                backgroundColor: isActive ? color : 'transparent',
                                borderColor: isActive ? color : 'rgba(255,255,255,0.1)'
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    // Calculate pain reduction delta
    const painAnalytics = useMemo(() => {
        let count = 0;
        let totalReduction = 0;
        let sumBefore = 0;
        let sumAfter = 0;

        // ⚡ Bolt Optimization: Replace multiple .filter() and .reduce() with single pass O(N) loop
        for (const s of sessions) {
            if (s.pain_before !== undefined && s.pain_after !== undefined) {
                count++;
                const before = s.pain_before || 0;
                const after = s.pain_after || 0;
                totalReduction += (before - after);
                sumBefore += before;
                sumAfter += after;
            }
        }

        if (count === 0) return null;

        const averageBefore = Math.round((sumBefore / count) * 10) / 10;
        const averageAfter = Math.round((sumAfter / count) * 10) / 10;

        return {
            totalReduction,
            averageBefore,
            averageAfter,
            sessionsCount: count
        };
    }, [sessions]);

    return (
        <div className="space-y-6 font-mono text-[#e5e2e1]">
            <SharedStatusHeader
                bothActiveToday={bothActiveToday}
                accentColor={accentColor}
                isUsingLocalStorage={isUsingLocalStorage}
                motivationalMessage={motivationalMessage}
                syncStreak={syncStreak}
                weeklyStats={weeklyStats}
                renderChunkedBar={renderChunkedBar}
                feedbackMessage={feedbackMessage}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                {/* LEFT COLUMN: DUAL PANELS + SESSIONS LOG FORM */}
                <div className="space-y-6">
                    <DualUserPanels />
                    
                    <QuickLogForm
                        isElla={isElla}
                        accentColor={accentColor}
                        isSubmitting={isSubmitting}
                        sessionType={sessionType}
                        setSessionType={setSessionType}
                        duration={duration}
                        setDuration={setDuration}
                        difficulty={difficulty}
                        setDifficulty={setDifficulty}
                        energyLevel={energyLevel}
                        setEnergyLevel={setEnergyLevel}
                        completionStatus={completionStatus}
                        setCompletionStatus={setCompletionStatus}
                        notes={notes}
                        setNotes={setNotes}
                        showTherapyFields={showTherapyFields}
                        painBefore={painBefore}
                        setPainBefore={setPainBefore}
                        painAfter={painAfter}
                        setPainAfter={setPainAfter}
                        fatigueLevel={fatigueLevel}
                        setFatigueLevel={setFatigueLevel}
                        mobilityStatus={mobilityStatus}
                        setMobilityStatus={setMobilityStatus}
                        therapistNotes={therapistNotes}
                        setTherapistNotes={setTherapistNotes}
                        handleLogSession={handleLogSession}
                        applyPreset={applyPreset}
                        presetsEl={PRESETS_EL}
                        presetsElla={PRESETS_ELLA}
                    />
                </div>

                {/* RIGHT COLUMN: RECENT HISTORY + PROGRESS ANALYTICS */}
                <div className="space-y-6">
                    <ProgressAnalytics
                        isElla={isElla}
                        weeklyStats={weeklyStats}
                        sessions={sessions}
                        accentColor={accentColor}
                        painAnalytics={painAnalytics}
                    />

                    <ActivityHistory
                        sessions={sessions}
                        profile={profile as string}
                        isElla={isElla}
                        loading={loading}
                        handleDeleteSession={handleDeleteSession}
                        handleAddReaction={handleAddReaction}
                        REACTION_CONFIG={REACTION_CONFIG}
                    />
                </div>
            </div>

            {/* Custom gradients for layout glow effects */}
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c3f400" />
                        <stop offset="100%" stopColor="#ff4b89" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
