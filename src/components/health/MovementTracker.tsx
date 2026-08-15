'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { useToast } from '@/components/ui/Toast';


import { useMovementData } from './movement/useMovementData';
import { useMovementMetrics } from './movement/useMovementMetrics';
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
    MovementSession
} from './movement/types';

import { CATEGORY_LABELS, PRESETS_EL, PRESETS_ELLA, REACTION_CONFIG } from './movement/constants';

export function MovementTracker() {
    const { profile } = useProfile();
    const { confirm, success, error: notifyError } = useToast();
    const isElla = profile === 'ella';
    
    // Core styling based on currently logged user
    const accentColor = isElla ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const {
        sessions,
        setSessions,
        isUsingLocalStorage,
        loading,
        fetchSessions,
        handleDeleteSession,
        handleAddReaction
    } = useMovementData(profile);

    const {
        activeElToday,
        activeEllaToday,
        bothActiveToday,
        syncStreak,
        weeklyStats,
        motivationalMessage,
        painAnalytics
    } = useMovementMetrics(sessions);

    

    
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


    const handleDeleteSessionWrapper = async (id: string) => {
        const ok = await confirm({
            title: 'Eliminar sesión',
            message: 'Se borrará este registro de actividad. No se puede deshacer.',
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await handleDeleteSession(id, notifyError);
            success('Sesión eliminada.');
        } catch (err) {
            // Error handled in hook
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
                        loading={loading}
                        handleDeleteSession={handleDeleteSessionWrapper}
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
