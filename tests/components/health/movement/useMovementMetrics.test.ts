import { renderHook } from '@testing-library/react';
import { useMovementMetrics } from '@/components/health/movement/useMovementMetrics';
import { MovementSession } from '@/components/health/movement/types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useMovementMetrics', () => {

    beforeEach(() => {
        // Mock current date to a fixed point in time
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-10-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockSession = (overrides: Partial<MovementSession> = {}): MovementSession => ({
        id: '1',
        profile: 'el',
        date: '2023-10-15',
        session_type: 'mobility',
        duration: 30,
        difficulty: 'medium',
        energy_level: 'medium',
        completion_status: 'completed',
        reactions: [],
        created_at: '2023-10-15T10:00:00Z',
        ...overrides,
    });

    it('handles empty sessions gracefully', () => {
        const { result } = renderHook(() => useMovementMetrics([]));

        expect(result.current.activeElToday).toBe(false);
        expect(result.current.activeEllaToday).toBe(false);
        expect(result.current.bothActiveToday).toBe(false);
        expect(result.current.syncStreak).toBe(0);
        expect(result.current.weeklyStats.totalCompleted).toBe(0);
        expect(result.current.painAnalytics).toBeNull();
    });

    it('identifies active users today', () => {
        const sessions = [
            mockSession({ profile: 'el', date: '2023-10-15' }),
            mockSession({ id: '2', profile: 'ella', date: '2023-10-15' }),
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.activeElToday).toBe(true);
        expect(result.current.activeEllaToday).toBe(true);
        expect(result.current.bothActiveToday).toBe(true);
        expect(result.current.motivationalMessage.title).toBe('SYNC_COMPLETE');
    });

    it('calculates sync streak correctly with consecutive days', () => {
        const sessions = [
            mockSession({ date: '2023-10-15' }), // Today
            mockSession({ id: '2', date: '2023-10-14' }), // Yesterday
            mockSession({ id: '3', date: '2023-10-13' }), // Day before
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.syncStreak).toBe(3);
    });

    it('maintains streak if missing today but present yesterday', () => {
        const sessions = [
            mockSession({ date: '2023-10-14' }), // Yesterday
            mockSession({ id: '2', date: '2023-10-13' }), // Day before
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.syncStreak).toBe(2);
    });

    it('breaks streak if missing today and yesterday', () => {
        const sessions = [
            mockSession({ date: '2023-10-13' }), // Day before yesterday
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.syncStreak).toBe(0);
    });

    it('calculates weekly stats correctly', () => {
        const sessions = [
            mockSession({ profile: 'el', date: '2023-10-15' }), // Today (in week)
            mockSession({ profile: 'ella', date: '2023-10-10' }), // In week
            mockSession({ profile: 'el', date: '2023-10-01' }), // Out of week
            mockSession({ profile: 'el', date: '2023-10-12', completion_status: 'recovery' }), // In week, recovery
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.weeklyStats.totalCompleted).toBe(3);
        expect(result.current.weeklyStats.elSessions).toBe(2);
        expect(result.current.weeklyStats.ellaSessions).toBe(1);
        expect(result.current.weeklyStats.recoveryDays).toBe(1);
        expect(result.current.weeklyStats.activeDaysCount).toBe(3); // 15, 10, 12
        expect(result.current.weeklyStats.goalProgressPercentage).toBe(43); // Math.round((3/7)*100)
    });

    it('generates correct motivational messages based on activity', () => {
        // Both active
        const { result: resBoth } = renderHook(() => useMovementMetrics([
            mockSession({ profile: 'el', date: '2023-10-15' }),
            mockSession({ profile: 'ella', date: '2023-10-15' })
        ]));
        expect(resBoth.current.motivationalMessage.title).toBe('SYNC_COMPLETE');

        // Only El
        const { result: resEl } = renderHook(() => useMovementMetrics([
            mockSession({ profile: 'el', date: '2023-10-15' })
        ]));
        expect(resEl.current.motivationalMessage.title).toBe('MOVEMENT_LOGGED_SUCCESS');
        expect(resEl.current.motivationalMessage.text).toContain('Él');

        // Only Ella
        const { result: resElla } = renderHook(() => useMovementMetrics([
            mockSession({ profile: 'ella', date: '2023-10-15' })
        ]));
        expect(resElla.current.motivationalMessage.title).toBe('MOVEMENT_LOGGED_SUCCESS');
        expect(resElla.current.motivationalMessage.text).toContain('Ella');

        // Neither
        const { result: resNeither } = renderHook(() => useMovementMetrics([]));
        expect(resNeither.current.motivationalMessage.title).toBe('CONSISTENCY_BUILDS_RECOVERY');
    });

    it('calculates pain analytics correctly', () => {
        const sessions = [
            mockSession({ pain_before: 6, pain_after: 3 }), // reduction 3
            mockSession({ pain_before: 5, pain_after: 4 }), // reduction 1
            mockSession({ pain_before: undefined }), // ignore
        ];

        const { result } = renderHook(() => useMovementMetrics(sessions));

        expect(result.current.painAnalytics).toEqual({
            totalReduction: 4,
            averageBefore: 5.5, // (6+5)/2
            averageAfter: 3.5,  // (3+4)/2
            sessionsCount: 2
        });
    });
});
