'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Flame, Award, Heart, TrendingDown, Clock, Check, 
    Plus, AlertCircle, Dumbbell, Compass, Smile, Zap, Trash2, HelpCircle, Shield 
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';

// --- Type Definitions ---
export type SessionCategory = 
    | 'physical_therapy' | 'occupational_therapy' | 'mobility' | 'stretching' | 'recovery'
    | 'strength' | 'cardio' | 'legs' | 'core';

export type DifficultyLevel = 'low' | 'medium' | 'high';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type CompletionStatus = 'active' | 'recovery' | 'rest_day' | 'completed';
export type MobilityStatus = 'good' | 'normal' | 'limited';

export type ReactionType = 'GOOD_JOB' | 'KEEP_GOING' | 'RECOVERY_DAY' | 'PROUD_OF_YOU';

export interface Reaction {
    reactor: 'el' | 'ella';
    type: ReactionType;
    timestamp: string;
}

export interface MovementSession {
    id: string;
    profile: 'el' | 'ella';
    date: string;
    session_type: SessionCategory;
    duration: number; // in minutes
    difficulty: DifficultyLevel;
    energy_level: EnergyLevel;
    notes?: string;
    completion_status: CompletionStatus;
    pain_before?: number; // 0-10
    pain_after?: number; // 0-10
    fatigue_level?: number; // 1-5
    mobility_status?: MobilityStatus;
    therapist_notes?: string;
    reactions: Reaction[];
    created_at: string;
}

// --- Configuration Constants ---
const CATEGORY_LABELS: Record<SessionCategory, { label: string; icon: typeof Dumbbell; isTherapy: boolean }> = {
    physical_therapy: { label: 'Terapia Física', icon: Heart, isTherapy: true },
    occupational_therapy: { label: 'Terapia Ocupacional', icon: Compass, isTherapy: true },
    mobility: { label: 'Movilidad', icon: Activity, isTherapy: false },
    stretching: { label: 'Estiramiento', icon: Compass, isTherapy: false },
    recovery: { label: 'Recuperación Activa', icon: Smile, isTherapy: false },
    strength: { label: 'Fuerza', icon: Dumbbell, isTherapy: false },
    cardio: { label: 'Cardio', icon: Zap, isTherapy: false },
    legs: { label: 'Pierna', icon: Dumbbell, isTherapy: false },
    core: { label: 'Core / Abdomen', icon: Shield, isTherapy: false }
};

const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string }> = {
    GOOD_JOB: { label: 'BUEN TRABAJO', emoji: '👍', color: '#c3f400' },
    KEEP_GOING: { label: 'SIGUE ASÍ', emoji: '🔥', color: '#ffb1c3' },
    RECOVERY_DAY: { label: 'DÍA DE DESCANSO', emoji: '🍃', color: '#d1bcff' },
    PROUD_OF_YOU: { label: 'ORGULLOSO DE TI', emoji: '💫', color: '#ff4b89' }
};

const PRESETS_EL: Omit<MovementSession, 'id' | 'profile' | 'date' | 'reactions' | 'created_at'>[] = [
    {
        session_type: 'physical_therapy',
        duration: 30,
        difficulty: 'medium',
        energy_level: 'medium',
        completion_status: 'completed',
        pain_before: 5,
        pain_after: 3,
        fatigue_level: 3,
        mobility_status: 'normal',
        notes: 'Ejercicios de estabilidad y control de cadera/rodilla.',
        therapist_notes: 'Enfoque en alineación patelar y propiocepción.'
    },
    {
        session_type: 'occupational_therapy',
        duration: 25,
        difficulty: 'medium',
        energy_level: 'high',
        completion_status: 'completed',
        pain_before: 4,
        pain_after: 2,
        fatigue_level: 2,
        mobility_status: 'normal',
        notes: 'Ejercicios de motricidad fina y fortalecimiento de agarre.',
        therapist_notes: 'Trabajo de pinzas y pinza lateral.'
    },
    {
        session_type: 'mobility',
        duration: 15,
        difficulty: 'low',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Rutina de movilidad articular de columna y hombros.'
    },
    {
        session_type: 'recovery',
        duration: 20,
        difficulty: 'low',
        energy_level: 'low',
        completion_status: 'recovery',
        notes: 'Liberación miofascial y respiración profunda en colchoneta.'
    }
];

const PRESETS_ELLA: Omit<MovementSession, 'id' | 'profile' | 'date' | 'reactions' | 'created_at'>[] = [
    {
        session_type: 'strength',
        duration: 45,
        difficulty: 'high',
        energy_level: 'high',
        completion_status: 'completed',
        notes: 'Entrenamiento de empuje/tracción tren superior.'
    },
    {
        session_type: 'cardio',
        duration: 30,
        difficulty: 'high',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Intervalos en bicicleta estática + saltos.'
    },
    {
        session_type: 'legs',
        duration: 40,
        difficulty: 'medium',
        energy_level: 'high',
        completion_status: 'completed',
        notes: 'Sentadillas, zancadas e isquiotibiales con peso moderado.'
    },
    {
        session_type: 'mobility',
        duration: 20,
        difficulty: 'low',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Movilidad de cadera y flexibilidad de flexores.'
    }
];

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

    // Fallback ID generator
    const generateId = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
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

            StoreService.addNotification(partner, 'movement', noteMsg).catch(err => {
                console.error('Failed to trigger movement notification', err);
            });

            // Si la pareja también completó sesión hoy, enviar notificación de Sincronía
            const partnerLogs = sessions.filter(s => s.profile === partner && s.date === todayStr && s.completion_status === 'completed');
            if (partnerLogs.length > 0 && completionStatus === 'completed') {
                const syncMsg = `¡Sincronía de Movimiento Completada! Ambos están activos hoy.`;
                StoreService.addNotification(partner, 'movement_sync', syncMsg).catch(err => {
                    console.error('Failed to trigger sync notification', err);
                });
            }

            // Success feedback
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
        const targetSession = sessions.find(s => s.id === sessionId);
        if (!targetSession) return;

        const newRx: Reaction = {
            reactor: profile as 'el' | 'ella',
            type: rxType,
            timestamp: new Date().toISOString()
        };

        // Filter out any existing reaction of the same reactor to avoid duplicates
        const filteredRx = targetSession.reactions.filter(r => r.reactor !== profile);
        const updatedReactions = [...filteredRx, newRx];

        try {
            if (!isUsingLocalStorage) {
                const { error } = await supabase
                    .from('movement_sessions')
                    .update({ reactions: updatedReactions })
                    .eq('id', sessionId);
                if (error) throw error;
                await fetchSessions();
            } else {
                const updated = sessions.map(s => {
                    if (s.id === sessionId) {
                        return { ...s, reactions: updatedReactions };
                    }
                    return s;
                });
                localStorage.setItem('movement_sessions', JSON.stringify(updated));
                setSessions(updated);
            }
        } catch (err) {
            console.error('Failed to add support reaction', err);
        }
    };

    // --- Derived Metrics & Logic ---

    // Sessions logged today by each user
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = useMemo(() => {
        return sessions.filter(s => s.date === todayStr);
    }, [sessions, todayStr]);

    const activeElToday = useMemo(() => todayLogs.some(s => s.profile === 'el'), [todayLogs]);
    const activeEllaToday = useMemo(() => todayLogs.some(s => s.profile === 'ella'), [todayLogs]);
    
    // Glow Dual Triggered when BOTH are active today!
    const bothActiveToday = activeElToday && activeEllaToday;

    // SYNC_STREAK Calculator: consecutive days where at least one or both logged activity.
    const syncStreak = useMemo(() => {
        if (sessions.length === 0) return 0;

        // Group sessions by unique date strings
        const datesWithActivity = new Set(sessions.map(s => s.date));
        
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
        
        const thisWeeksSessions = sessions.filter(s => new Date(s.date) >= startOfWeek);
        
        const elSessions = thisWeeksSessions.filter(s => s.profile === 'el').length;
        const ellaSessions = thisWeeksSessions.filter(s => s.profile === 'ella').length;
        const totalCompleted = thisWeeksSessions.length;
        
        const activeDates = new Set(thisWeeksSessions.map(s => s.date));
        const activeDaysCount = activeDates.size;
        
        // Target: Combined 8 sessions a week
        const combinedTarget = 8;
        const goalProgressPercentage = Math.min(100, Math.round((totalCompleted / combinedTarget) * 100));

        // Recovery vs Active ratio
        const recoveryDays = thisWeeksSessions.filter(s => s.completion_status === 'recovery' || s.completion_status === 'rest_day').length;
        
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
        const therapyLogs = sessions.filter(s => s.pain_before !== undefined && s.pain_after !== undefined);
        if (therapyLogs.length === 0) return null;
        
        const totalReduction = therapyLogs.reduce((acc, s) => {
            const before = s.pain_before || 0;
            const after = s.pain_after || 0;
            return acc + (before - after);
        }, 0);

        const averageBefore = Math.round((therapyLogs.reduce((acc, s) => acc + (s.pain_before || 0), 0) / therapyLogs.length) * 10) / 10;
        const averageAfter = Math.round((therapyLogs.reduce((acc, s) => acc + (s.pain_after || 0), 0) / therapyLogs.length) * 10) / 10;

        return {
            totalReduction,
            averageBefore,
            averageAfter,
            sessionsCount: therapyLogs.length
        };
    }, [sessions]);

    return (
        <div className="space-y-6 font-mono text-[#e5e2e1]">
            
            {/* CAPA 1: SHARED STATUS HEADER WITH GLOW DUAL */}
            <div className={`relative border p-6 bg-black transition-all duration-700 ${
                bothActiveToday 
                    ? 'border-transparent shadow-[0_0_20px_rgba(195,244,0,0.15),_0_0_20px_rgba(255,75,137,0.15)]' 
                    : 'border-white/10'
            }`}>
                {/* Visual dual synchronized glow backgrounds */}
                {bothActiveToday && (
                    <>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c3f400] to-[#ff4b89]" />
                        <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-tr from-[#c3f400] via-transparent to-[#ff4b89] pointer-events-none" />
                        <div className="absolute -top-1 left-4 px-2 py-0.5 bg-gradient-to-r from-[#c3f400] to-[#ff4b89] text-black text-[7px] font-black tracking-widest uppercase">
                            GLOW_DUAL_SYNCED_ACTIVE
                        </div>
                    </>
                )}

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span 
                                className="border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.25em]"
                                style={{ 
                                    borderColor: bothActiveToday ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                                    backgroundImage: bothActiveToday ? 'linear-gradient(to right, #c3f400, #ff4b89)' : 'none',
                                    color: bothActiveToday ? 'black' : accentColor
                                }}
                            >
                                {motivationalMessage.title}
                            </span>
                            {isUsingLocalStorage && (
                                <span className="border border-amber-500/30 text-amber-500 bg-amber-500/5 px-2 py-0.5 text-[7px] font-black tracking-widest uppercase">
                                    LOCAL_SANDBOX_ACTIVE
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-bold text-white/90 uppercase tracking-tight leading-relaxed">
                            {motivationalMessage.text}
                        </p>
                        <p className="text-[10px] text-[#a88a7e]">
                            Priorizando consistencia sobre intensidad. El descanso y la recuperación forman parte de tu progreso operativo.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Streak Box */}
                        <div className="border border-white/10 bg-[#070707] p-4 text-center min-w-[120px] relative">
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#c3f400]" style={{ backgroundColor: accentColor }} />
                            <Flame 
                                className="w-5 h-5 mx-auto mb-1 animate-pulse" 
                                style={{ color: bothActiveToday ? 'url(#syncGrad)' : accentColor }} 
                            />
                            <div className="text-3xl font-black font-mono tracking-tight tabular-nums text-white">
                                {syncStreak}
                            </div>
                            <div className="text-[7px] font-black uppercase tracking-[0.2em] text-[#a88a7e] mt-1">
                                SYNC_STREAK
                            </div>
                        </div>

                        {/* Combined Weekly Metrics */}
                        <div className="border border-white/10 bg-[#070707] p-4 min-w-[200px] flex-1 lg:flex-none">
                            <div className="flex justify-between items-center text-[8px] font-bold text-[#a88a7e] uppercase tracking-wider mb-2">
                                <span>Progreso Semanal</span>
                                <span className="font-mono tabular-nums text-white">{weeklyStats.totalCompleted}/8 Sesiones</span>
                            </div>
                            {renderChunkedBar(weeklyStats.goalProgressPercentage, bothActiveToday ? '#ff4b89' : accentColor)}
                            
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[8px] uppercase font-bold text-[#a88a7e]">
                                <div>
                                    <span className="text-[6px] block text-white/40">DÍAS ACTIVOS</span>
                                    <span className="text-white font-mono font-black text-xs tabular-nums">{weeklyStats.activeDaysCount}d / 7d</span>
                                </div>
                                <div>
                                    <span className="text-[6px] block text-white/40">DESCANSOS</span>
                                    <span className="text-white font-mono font-black text-xs tabular-nums">{weeklyStats.recoveryDays}d</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEEDBACK FLOATER ON ACTION SUBMITTED */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border text-black text-center text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 relative z-50"
                        style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    >
                        <Zap className="w-4 h-4 fill-black" />
                        {feedbackMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                
                {/* LEFT COLUMN: DUAL PANELS + SESSIONS LOG FORM */}
                <div className="space-y-6">
                    
                    {/* CAPA 2: DUAL USER PANELS (STATUS DISPLAY) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 border border-white/10 bg-[#030303] divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        {/* Panel de "ÉL" */}
                        <div className="p-5 flex flex-col justify-between min-h-[170px] relative">
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-bold text-[#c3f400] uppercase tracking-wider bg-[#c3f400]/5 px-2 py-0.5 border border-[#c3f400]/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c3f400]" />
                                ÉL / TERAPIA Y RECUPERACIÓN
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4 mb-1">
                                    Enfoque de Recuperación
                                </h3>
                                <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                                    Terapia física, terapia ocupacional, estiramiento táctico y movilidad articular.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-[#a88a7e]">
                                <span>Sesiones (7 días)</span>
                                <span className="text-[#c3f400] font-black text-xs font-mono">{weeklyStats.elSessions}</span>
                            </div>
                        </div>

                        {/* Panel de "ELLA" */}
                        <div className="p-5 flex flex-col justify-between min-h-[170px] relative">
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-bold text-[#ff4b89] uppercase tracking-wider bg-[#ff4b89]/5 px-2 py-0.5 border border-[#ff4b89]/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b89]" />
                                ELLA / FUERZA Y RESISTENCIA
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4 mb-1">
                                    Enfoque de Resistencia
                                </h3>
                                <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                                    Entrenamiento de potencia, fuerza muscular, cardio funcional y core.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-[#a88a7e]">
                                <span>Sesiones (7 días)</span>
                                <span className="text-[#ff4b89] font-black text-xs font-mono">{weeklyStats.ellaSessions}</span>
                            </div>
                        </div>
                    </div>

                    {/* CAPA 3: FORMULARIO DE REGISTRO RÁPIDO */}
                    <div className="border border-white/10 bg-[#080808] p-6 relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-5 border-b border-white/5 pb-3 flex items-center justify-between">
                            <span>[ Registrar mi Actividad Física ]</span>
                            <span className="text-[8px] opacity-40">Registro Diario</span>
                        </h3>

                        {/* Presets / Quick Logging Buttons */}
                        <div className="mb-6 space-y-2.5">
                            <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 block">
                                Cargar ejercicio frecuente (Preajustes de {isElla ? 'Ella' : 'Él'}):
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {currentPresets.map((preset, index) => {
                                    const label = CATEGORY_LABELS[preset.session_type]?.label || preset.session_type;
                                    return (
                                        <button 
                                            key={index}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className="px-2 py-2 border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-[9px] font-black uppercase text-left transition-all truncate border-l-2 hover:border-l-white"
                                            style={{ borderLeftColor: accentColor }}
                                        >
                                            {label}
                                            <span className="block text-[7px] text-white/40 font-mono font-bold mt-0.5">
                                                {preset.duration}m | {preset.difficulty}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleLogSession} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Session Type */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Tipo de Actividad</label>
                                    <select
                                        value={sessionType}
                                        onChange={e => setSessionType(e.target.value as SessionCategory)}
                                        className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-white/30 text-white cursor-pointer"
                                    >
                                        {/* Show He categories first if current user is El, and vice versa */}
                                        {!isElla ? (
                                            <>
                                                <option value="physical_therapy">Terapia Física</option>
                                                <option value="occupational_therapy">Terapia Ocupacional</option>
                                                <option value="mobility">Movilidad Articular</option>
                                                <option value="stretching">Estiramiento</option>
                                                <option value="recovery">Recuperación Activa</option>
                                                <option value="strength">Fuerza</option>
                                                <option value="cardio">Cardio</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="strength">Fuerza</option>
                                                <option value="cardio">Cardio</option>
                                                <option value="legs">Entrenamiento Pierna</option>
                                                <option value="core">Entrenamiento Core</option>
                                                <option value="mobility">Movilidad Dinámica</option>
                                                <option value="stretching">Estiramiento</option>
                                                <option value="recovery">Recuperación Activa</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Duration */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Duración (Minutos)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="300"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-white/30 text-white font-mono"
                                        placeholder="Ej: 30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Difficulty */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Nivel de Esfuerzo</label>
                                    <div className="flex border border-white/10">
                                        {(['low', 'medium', 'high'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setDifficulty(lvl)}
                                                className={`flex-1 py-2 text-[9px] uppercase font-black transition-all ${
                                                    difficulty === lvl 
                                                        ? 'bg-white text-black' 
                                                        : 'bg-black text-[#a88a7e] hover:bg-white/5'
                                                }`}
                                            >
                                                {lvl === 'low' ? 'Baja' : lvl === 'medium' ? 'Media' : 'Alta'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Energy Level */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Energía al iniciar</label>
                                    <div className="flex border border-white/10">
                                        {(['low', 'medium', 'high'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setEnergyLevel(lvl)}
                                                className={`flex-1 py-2 text-[9px] uppercase font-black transition-all ${
                                                    energyLevel === lvl 
                                                        ? 'bg-white text-black' 
                                                        : 'bg-black text-[#a88a7e] hover:bg-white/5'
                                                }`}
                                            >
                                                {lvl === 'low' ? 'Bajo' : lvl === 'medium' ? 'Medio' : 'Alto'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Daily Status Mode */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Estado de la actividad</label>
                                    <select
                                        value={completionStatus}
                                        onChange={e => setCompletionStatus(e.target.value as CompletionStatus)}
                                        className="w-full bg-black border border-white/10 p-2.5 text-xs font-bold outline-none focus:border-white/30 text-white cursor-pointer"
                                    >
                                        <option value="completed">Sesión Completada</option>
                                        <option value="recovery">Día de Recuperación</option>
                                        <option value="rest_day">Día de Descanso</option>
                                    </select>
                                </div>
                            </div>

                            {/* Therapy Specific Advanced Fields */}
                            <AnimatePresence>
                                {showTherapyFields && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-4 pt-4 border-t border-white/5"
                                    >
                                        <h4 className="text-[8px] font-black uppercase tracking-wider text-emerald-500">
                                            [ REGISTRO ESPECIALIZADO DE TERAPIA REHABILITADORA ]
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e]">Dolor inicial (0 al 10)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={painBefore}
                                                    onChange={e => setPainBefore(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 5"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e]">Dolor al finalizar (0 al 10)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={painAfter}
                                                    onChange={e => setPainAfter(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 3"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e]">Estado de movilidad</label>
                                                <select
                                                    value={mobilityStatus}
                                                    onChange={e => setMobilityStatus(e.target.value as MobilityStatus)}
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none focus:border-white/30 text-white cursor-pointer"
                                                >
                                                    <option value="good">Adecuado</option>
                                                    <option value="normal">Esperado</option>
                                                    <option value="limited">Restringido</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e]">Nivel de fatiga (1 al 5)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={fatigueLevel}
                                                    onChange={e => setFatigueLevel(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 2"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e]">Notas del terapeuta / Indicaciones</label>
                                                <input
                                                    type="text"
                                                    value={therapistNotes}
                                                    onChange={e => setTherapistNotes(e.target.value)}
                                                    placeholder="Pautas del fisioterapeuta..."
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none focus:border-white/30 text-white"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e]">Notas u observaciones personales</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Sensaciones de la sesión, progreso o estado del cuerpo..."
                                    rows={2}
                                    className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-white/30 text-white resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 text-[10px] uppercase font-black tracking-[0.25em] transition-all border mt-2 flex items-center justify-center gap-2"
                                style={{ 
                                    backgroundColor: accentColor, 
                                    borderColor: accentColor, 
                                    color: 'black' 
                                }}
                            >
                                {isSubmitting ? 'GUARDANDO...' : 'REGISTRAR ACTIVIDAD'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: RECENT HISTORY + PROGRESS ANALYTICS */}
                <div className="space-y-6">
                    
                    {/* CAPA 4: PROGRESS ANALYTICS */}
                    <div className="border border-white/10 bg-[#060606] p-6 relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-4 border-b border-white/5 pb-3">
                            [ Resumen de Progreso ]
                        </h3>

                        {/* Therapy specific analytics displayed if logs are available */}
                        {painAnalytics && (
                            <div className="border border-emerald-900/30 bg-emerald-950/5 p-4 mb-5 space-y-3">
                                <h4 className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Tu evolución y recuperación
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border-r border-white/5 pr-2">
                                        <span className="text-[7px] text-[#a88a7e] block uppercase">Nivel de dolor (Antes / Después)</span>
                                        <span className="text-sm font-black tabular-nums text-white">
                                            {painAnalytics.averageBefore} → <span className="text-emerald-400">{painAnalytics.averageAfter}</span>
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[7px] text-[#a88a7e] block uppercase">Disminución del dolor</span>
                                        <span className="text-sm font-black tabular-nums text-emerald-400">
                                            -{painAnalytics.totalReduction} Puntos
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[7px] text-[#a88a7e] uppercase">
                                    Análisis generado sobre {painAnalytics.sessionsCount} sesiones de terapia.
                                </p>
                            </div>
                        )}

                        {/* Heatmap Matrix for Weekly consistency */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] block">
                                Consistencia de la semana (Él / Ella):
                            </label>
                            
                            <div className="grid grid-cols-7 gap-1.5 text-center">
                                {Array.from({ length: 7 }).map((_, index) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - index));
                                    const dStr = d.toISOString().split('T')[0];
                                    const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
                                    
                                    const userElLogs = sessions.filter(s => s.profile === 'el' && s.date === dStr);
                                    const userEllaLogs = sessions.filter(s => s.profile === 'ella' && s.date === dStr);

                                    const isElActive = userElLogs.some(s => s.completion_status === 'completed');
                                    const isElRecovery = userElLogs.some(s => s.completion_status === 'recovery');
                                    const isElRest = userElLogs.some(s => s.completion_status === 'rest_day');

                                    const isEllaActive = userEllaLogs.some(s => s.completion_status === 'completed');
                                    const isEllaRecovery = userEllaLogs.some(s => s.completion_status === 'recovery');
                                    const isEllaRest = userEllaLogs.some(s => s.completion_status === 'rest_day');

                                    return (
                                        <div key={index} className="flex flex-col gap-1">
                                            <div className="text-[8px] font-bold text-white/30 uppercase">{label[0]}</div>
                                            
                                            {/* El Box */}
                                            <div 
                                                className="h-6 border border-white/5 relative"
                                                style={{ 
                                                    backgroundColor: isElActive ? '#c3f400' : isElRecovery ? '#c3f4002b' : isElRest ? '#0f172a' : 'transparent',
                                                    borderColor: isElActive ? '#c3f400' : 'rgba(255,255,255,0.05)'
                                                }}
                                                title={`Él: ${dStr}`}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-black/50">
                                                    {isElRest ? 'R' : ''}
                                                </span>
                                            </div>
                                            
                                            {/* Ella Box */}
                                            <div 
                                                className="h-6 border border-white/5 relative"
                                                style={{ 
                                                    backgroundColor: isEllaActive ? '#ff4b89' : isEllaRecovery ? '#ff4b892b' : isEllaRest ? '#0f172a' : 'transparent',
                                                    borderColor: isEllaActive ? '#ff4b89' : 'rgba(255,255,255,0.05)'
                                                }}
                                                title={`Ella: ${dStr}`}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-black/50">
                                                    {isEllaRest ? 'R' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-[7px] text-white/40 uppercase font-black font-mono">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#c3f400]" /> Él Activo
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#ff4b89]" /> Ella Activa
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-slate-900 border border-white/10" /> Descanso (R)
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-emerald-500/20" /> Recuperación Activa
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CAPA 3: HISTORIAL & ACTIVIDAD RECIENTE */}
                    <div className="border border-white/10 bg-black p-5 relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-4 pb-2 border-b border-white/5">
                            [ Historial de Actividad ]
                        </h3>

                        {loading ? (
                            <div className="py-8 text-center text-xs text-white/30">Cargando registros...</div>
                        ) : sessions.length === 0 ? (
                            <div className="py-12 border border-dashed border-white/10 text-center text-xs text-white/20">
                                No hay sesiones registradas en la base de datos.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {sessions.slice(0, 25).map(session => {
                                    const isSelf = session.profile === profile;
                                    const accent = session.profile === 'ella' ? '#ff4b89' : '#c3f400';
                                    const accentTextClass = session.profile === 'ella' ? 'text-user-a' : 'text-user-b';
                                    const catConfig = CATEGORY_LABELS[session.session_type];
                                    const IconComponent = catConfig ? catConfig.icon : HelpCircle;

                                    return (
                                        <div 
                                            key={session.id} 
                                            className="p-4 border border-white/5 bg-[#070707] hover:border-white/10 transition-all space-y-3 relative group"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: accent }} />
                                            
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-1.5 border border-white/10 bg-black text-white mt-0.5">
                                                        <IconComponent className="w-3.5 h-3.5" style={{ color: accent }} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                                                {catConfig ? catConfig.label : session.session_type}
                                                            </span>
                                                            <span className={`text-[7px] font-black uppercase tracking-widest ${accentTextClass}`}>
                                                                {session.profile === 'ella' ? 'Ella' : 'Él'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[7px] text-white/30 font-bold mt-1 font-mono uppercase">
                                                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {session.duration} MIN</span>
                                                            <span>DIF: {session.difficulty}</span>
                                                            <span>ENERGÍA: {session.energy_level}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions / Delete */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono text-white/30 tabular-nums">
                                                        {session.date}
                                                    </span>
                                                    {isSelf && (
                                                        <button 
                                                            onClick={() => handleDeleteSession(session.id)}
                                                            className="text-stone-700 hover:text-red-500 transition-colors p-1"
                                                            title="Eliminar sesión"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Note / Description */}
                                            {session.notes && (
                                                <p className="text-[9px] text-[#e1bfb2] leading-relaxed pl-1.5 border-l border-white/10 italic">
                                                    "{session.notes}"
                                                </p>
                                            )}

                                            {/* Advanced clinical parameters (For rehabilitation focus) */}
                                            {catConfig?.isTherapy && (session.pain_before !== undefined || session.therapist_notes) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-emerald-950 bg-emerald-950/5 text-[8px] font-bold text-[#a88a7e] uppercase tracking-wider pl-2">
                                                    {session.pain_before !== undefined && (
                                                        <div>
                                                            <span className="text-white/40 block text-[6px]">EVOLUCIÓN DEL DOLOR:</span>
                                                            <span className="text-white">DOLOR: {session.pain_before}/10 → <span className="text-emerald-400 font-black">{session.pain_after}/10</span></span>
                                                        </div>
                                                    )}
                                                    {session.therapist_notes && (
                                                        <div>
                                                            <span className="text-white/40 block text-[6px]">PAUTAS REHABILITADORAS:</span>
                                                            <span className="text-white font-normal italic">"{session.therapist_notes}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mutual Support reactions list */}
                                            {session.reactions && session.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1 pl-1.5">
                                                    {session.reactions.map((rx, idx) => {
                                                        const rxConfig = REACTION_CONFIG[rx.type];
                                                        return (
                                                            <span 
                                                                key={idx}
                                                                className="px-2 py-0.5 border border-white/10 bg-black/40 text-[7px] font-black uppercase tracking-wider flex items-center gap-1 text-white/80"
                                                                style={{ borderLeftColor: rxConfig?.color || 'white' }}
                                                            >
                                                                <span>{rxConfig?.emoji}</span>
                                                                <span>{rx.reactor === 'el' ? 'Él' : 'Ella'}:</span>
                                                                <span style={{ color: rxConfig?.color }}>{rxConfig?.label}</span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Reaction Support Trigger Buttons (Allow logging reaction for partner) */}
                                            {!isSelf && (
                                                <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/5">
                                                    <span className="text-[7px] font-black tracking-widest text-[#a88a7e] uppercase block w-full mb-1">
                                                        [ MOTIVAR_A_TU_PAREJA ]:
                                                    </span>
                                                    {(Object.keys(REACTION_CONFIG) as ReactionType[]).map(rxType => {
                                                        const rxConfig = REACTION_CONFIG[rxType];
                                                        const alreadyReacted = session.reactions.some(r => r.reactor === profile && r.type === rxType);
                                                        
                                                        return (
                                                            <button
                                                                key={rxType}
                                                                onClick={() => handleAddReaction(session.id, rxType)}
                                                                className={`px-2 py-1 text-[7px] font-black uppercase tracking-wider border transition-all flex items-center gap-1 ${
                                                                    alreadyReacted 
                                                                        ? 'bg-white text-black border-white' 
                                                                        : 'bg-black hover:bg-white/5 border-white/10 text-white/50 hover:text-white'
                                                                }`}
                                                            >
                                                                <span>{rxConfig.emoji}</span>
                                                                <span>{rxConfig.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
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
