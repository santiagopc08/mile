'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { HabitHeader } from './habits/HabitHeader';
import { HabitLogForm } from './habits/HabitLogForm';
import { HabitAnalysis } from './habits/HabitAnalysis';
import { HabitHistory } from './habits/HabitHistory';

export function HabitTracker() {
    const { data, refreshData } = useStore();
    const { profile } = useProfile();
    const habits = useMemo(() => data?.healthHabits || [], [data?.healthHabits]);
    
    // Analysis
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgoTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        
        // ⚡ Bolt Optimization: Replace multiple .filter(), .reduce(), .map(), and .some()
        // with single pass O(N) loop and O(1) Set lookup.
        let totalSpent = 0;
        const byType: Record<string, number> = {};
        let oldestHabitTime = Infinity;
        let hasProfileHabits = false;
        const habitDates = new Set<string>();

        for (const h of habits) {
            if (h.profile === profile) {
                hasProfileHabits = true;
                const cost = h.cost || 0;

                if (new Date(h.createdAt).getTime() >= thirtyDaysAgoTime) {
                    totalSpent += cost;
                    byType[h.habitType] = (byType[h.habitType] || 0) + cost;
                }

                if (h.date) {
                    habitDates.add(h.date);
                }

                const time = new Date(h.date || h.createdAt).getTime();
                if (time < oldestHabitTime) {
                    oldestHabitTime = time;
                }
            }
        }

        // Calculate score
        let score: 'STABLE' | 'UNBALANCED' | 'CRITICAL_CONSUMPTION' = 'STABLE';
        if (totalSpent > 300000) score = 'CRITICAL_CONSUMPTION';
        else if (totalSpent > 100000) score = 'UNBALANCED';

        // Streak: consecutive days without any habit logged
        let streak = 0;
        if (hasProfileHabits) {
            const todayStr = now.toISOString().split('T')[0];
            const checkDate = new Date(now);
            const oldestHabitDate = new Date(oldestHabitTime);
            oldestHabitDate.setHours(0, 0, 0, 0);

            while (checkDate >= oldestHabitDate) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (!habitDates.has(dateStr)) {
                    if (dateStr !== todayStr || streak > 0) streak++; // don't count today if it's the only one
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Potential savings (reducing by 20%)
        const potentialSavings = totalSpent * 0.2;

        return { totalSpent, byType, score, streak, potentialSavings };
    }, [habits, profile]);

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
