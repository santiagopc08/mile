'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { AppData } from '@/services/storeService';
import { supabase } from '@/lib/supabase';

interface StoreContextType {
    data: AppData | null;
    isLoading: boolean;
    refreshData: () => Promise<void>;
    updateData: (newData: Partial<AppData>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async (tables?: string[]) => {
        try {
            setIsLoading(true);
            const query = tables && tables.length > 0 ? `?tables=${tables.join(',')}` : '';
            const res = await fetch(`/api/store${query}`);
            if (res.ok) {
                const json = await res.json();
                if (tables && tables.length > 0) {
                    setData(current => current ? { ...current, ...json } : json);
                } else {
                    setData(json);
                }
            }
        } catch (e) {
            console.error('Failed to fetch store data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const updateData = async (partial: Partial<AppData>) => {
        if (!data) return;

        // Optimistic update
        const optimistic: AppData = { ...data, ...partial };

        // If commitments changed, recalculate dailyProgress optimistically
        if (partial.commitments !== undefined && data.dailyProgress) {
            const todayCompleted = partial.commitments.filter((c: any) => c.completed).length;
            const todayTotal = partial.commitments.length;
            optimistic.dailyProgress = {
                ...data.dailyProgress,
                todayCompleted,
                todayTotal
            };
        }

        setData(optimistic);

        try {
            await fetch('/api/store', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partial)
            });
            await fetchData();
        } catch (e) {
            console.error('Failed to update store data', e);
            setData(data); // revert
        }
    };

    useEffect(() => {
        fetchData();
        
        const pendingSlices = new Set<string>();

        const handleDbChange = (payload: any) => {
            const tableName = payload.table;
            
            const getTablesToFetch = (supabaseTable: string): string[] => {
                if (['wishlist', 'wishlist_contributions', 'wishlist_reactions'].includes(supabaseTable)) {
                    return ['wishlist', 'wishlist_contributions', 'wishlist_reactions'];
                }
                if (['audio_track', 'audio_comments'].includes(supabaseTable)) {
                    return ['audio_track', 'audio_comments'];
                }
                if (['events', 'event_comments'].includes(supabaseTable)) {
                    return ['events', 'event_comments'];
                }
                return [supabaseTable];
            };

            const slices = getTablesToFetch(tableName);
            slices.forEach(s => pendingSlices.add(s));

            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = setTimeout(() => {
                const tablesArray = Array.from(pendingSlices);
                pendingSlices.clear();
                fetchData(tablesArray);
            }, 600);
        };

        const channel = supabase.channel(`global-store-changes-${crypto.randomUUID()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_contributions' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_reactions' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_comments' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'commitments' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'victories' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_track' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_comments' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'persistent_listening' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'health_habits' }, handleDbChange)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        };
    }, []);

    return (
        <StoreContext.Provider value={{ data, isLoading, refreshData: fetchData, updateData }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
