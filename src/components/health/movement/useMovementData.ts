import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { MovementSession, ReactionType, Reaction, SessionCategory, DifficultyLevel, EnergyLevel, CompletionStatus, MobilityStatus } from './types';

export function useMovementData(profile: string | null) {
    const [sessions, setSessions] = useState<MovementSession[]>([]);
    const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const handleDeleteSession = async (id: string, notifyError: (msg: string) => void) => {
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
            notifyError('No se pudo eliminar la sesión. Sigue en tu historial.');
            throw err;
        }
    };

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

    return {
        sessions,
        setSessions,
        isUsingLocalStorage,
        loading,
        fetchSessions,
        handleDeleteSession,
        handleAddReaction
    };
}
