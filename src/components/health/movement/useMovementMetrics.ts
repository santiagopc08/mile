import { useMemo } from 'react';
import { MovementSession } from './types';

export function useMovementMetrics(sessions: MovementSession[]) {
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

    return {
        activeElToday,
        activeEllaToday,
        bothActiveToday,
        syncStreak,
        weeklyStats,
        motivationalMessage,
        painAnalytics
    };
}
