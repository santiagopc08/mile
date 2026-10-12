import { useMemo } from 'react';
import type { HealthHabit } from '@/services/storeService';
import type { Profile } from '@/context/ProfileContext';

export function useHabitStats(habits: HealthHabit[], profile: Profile) {
    return useMemo(() => {
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

                // Safely handle missing createdAt by falling back to date or now if both missing
                const createdAtTime = h.createdAt ? new Date(h.createdAt).getTime() :
                                     h.date ? new Date(h.date).getTime() : now.getTime();

                if (createdAtTime >= thirtyDaysAgoTime) {
                    totalSpent += cost;
                    byType[h.habitType] = (byType[h.habitType] || 0) + cost;
                }

                if (h.date) {
                    habitDates.add(h.date);
                }

                const time = h.date ? new Date(h.date).getTime() : createdAtTime;
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
}
