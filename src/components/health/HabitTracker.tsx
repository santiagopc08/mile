'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { HabitHeader } from './habits/HabitHeader';
import { HabitLogForm } from './habits/HabitLogForm';
import { HabitAnalysis } from './habits/HabitAnalysis';
import { HabitHistory } from './habits/HabitHistory';
import { useHabitStats } from '@/hooks/useHabitStats';

export function HabitTracker() {
    const { data, refreshData } = useStore();
    const { profile } = useProfile();
    const habits = useMemo(() => data?.healthHabits || [], [data?.healthHabits]);
    
    // Analysis
    const stats = useHabitStats(habits, profile);

    const onRefresh = async () => {
        await refreshData();
    };

    // ⚡ Bolt Optimization: Replace O(N) inline map/filter with a single pass O(N) useMemo
    const recentHabitsForProfile = useMemo(() => {
        const recent = [];
        for (const h of habits) {
            if (h.profile === profile) {
                recent.push(h);
                if (recent.length >= 10) break;
            }
        }
        return recent;
    }, [habits, profile]);

    return (
        <div className="space-y-6">
            <HabitHeader stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HabitLogForm profile={profile} onRefresh={onRefresh} />

                <div className="space-y-6">
                    <HabitAnalysis stats={stats} />
                    <HabitHistory
                        recentHabitsForProfile={recentHabitsForProfile}
                        onRefresh={onRefresh}
                    />
                </div>
            </div>
        </div>
    );
}
