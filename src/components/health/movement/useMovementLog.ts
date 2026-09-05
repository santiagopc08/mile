import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/services/notificationService';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { CATEGORY_LABELS } from './constants';
import {
    SessionCategory,
    DifficultyLevel,
    EnergyLevel,
    CompletionStatus,
    MobilityStatus,
    MovementSession
} from './types';
import { PRESETS_EL } from './constants';

const generateId = () => {
    return crypto.randomUUID();
};

export function useMovementLog({
    profile,
    isElla,
    isUsingLocalStorage,
    sessions,
    setSessions,
    fetchSessions
}: {
    profile: string | null;
    isElla: boolean;
    isUsingLocalStorage: boolean;
    sessions: MovementSession[];
    setSessions: (sessions: MovementSession[]) => void;
    fetchSessions: () => Promise<void>;
}) {
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived state instead of useEffect
    const config = CATEGORY_LABELS[sessionType];
    const showTherapyFields = config ? config.isTherapy : false;

    // Track previous isElla to update sessionType when it changes
    const [prevIsElla, setPrevIsElla] = useState(isElla);
    if (isElla !== prevIsElla) {
        setPrevIsElla(isElla);
        setSessionType(isElla ? 'strength' : 'physical_therapy');
    }

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

    return {
        sessionType, setSessionType,
        duration, setDuration,
        difficulty, setDifficulty,
        energyLevel, setEnergyLevel,
        completionStatus, setCompletionStatus,
        notes, setNotes,
        painBefore, setPainBefore,
        painAfter, setPainAfter,
        fatigueLevel, setFatigueLevel,
        mobilityStatus, setMobilityStatus,
        therapistNotes, setTherapistNotes,
        showTherapyFields,
        feedbackMessage, setFeedbackMessage,
        isSubmitting, setIsSubmitting,
        handleLogSession,
        applyPreset
    };
}
