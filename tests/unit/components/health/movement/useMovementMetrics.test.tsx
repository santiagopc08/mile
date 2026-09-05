/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMovementMetrics } from '../../../../../src/components/health/movement/useMovementMetrics';
import { MovementSession } from '../../../../../src/components/health/movement/types';

describe('useMovementMetrics', () => {
    let mockDateStr = '2023-10-25';

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(`${mockDateStr}T12:00:00Z`));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const createSession = (overrides: Partial<MovementSession>): MovementSession => ({
        id: '1',
        profile: 'el',
        date: mockDateStr,
        session_type: 'cardio',
        duration: 30,
        difficulty: 'medium',
        energy_level: 'medium',
        completion_status: 'completed',
        reactions: [],
        created_at: new Date().toISOString(),
        ...overrides,
    });

    describe('empty array', () => {
        it('should handle empty sessions array', () => {
            const { result } = renderHook(() => useMovementMetrics([]));

            expect(result.current.activeElToday).toBe(false);
            expect(result.current.activeEllaToday).toBe(false);
            expect(result.current.bothActiveToday).toBe(false);
            expect(result.current.syncStreak).toBe(0);
            expect(result.current.weeklyStats.totalCompleted).toBe(0);
            expect(result.current.motivationalMessage.title).toBe('CONSISTENCY_BUILDS_RECOVERY');
            expect(result.current.painAnalytics).toBeNull();
        });
    });

    describe('daily active status', () => {
        it('should detect when only el is active today', () => {
            const sessions = [createSession({ profile: 'el' })];
            const { result } = renderHook(() => useMovementMetrics(sessions));

            expect(result.current.activeElToday).toBe(true);
            expect(result.current.activeEllaToday).toBe(false);
            expect(result.current.bothActiveToday).toBe(false);
            expect(result.current.motivationalMessage.title).toBe('MOVEMENT_LOGGED_SUCCESS');
        });

        it('should detect when only ella is active today', () => {
            const sessions = [createSession({ profile: 'ella' })];
            const { result } = renderHook(() => useMovementMetrics(sessions));

            expect(result.current.activeElToday).toBe(false);
            expect(result.current.activeEllaToday).toBe(true);
            expect(result.current.bothActiveToday).toBe(false);
            expect(result.current.motivationalMessage.title).toBe('MOVEMENT_LOGGED_SUCCESS');
        });

        it('should detect when both are active today', () => {
            const sessions = [
                createSession({ profile: 'el' }),
                createSession({ profile: 'ella', id: '2' })
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));

            expect(result.current.activeElToday).toBe(true);
            expect(result.current.activeEllaToday).toBe(true);
            expect(result.current.bothActiveToday).toBe(true);
            expect(result.current.motivationalMessage.title).toBe('SYNC_COMPLETE');
        });
    });

    describe('syncStreak', () => {
        it('should calculate streak for consecutive days ending today', () => {
            const sessions = [
                createSession({ date: '2023-10-25' }),
                createSession({ date: '2023-10-24', id: '2' }),
                createSession({ date: '2023-10-23', id: '3' }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.syncStreak).toBe(3);
        });

        it('should calculate streak if no activity today but activity yesterday', () => {
            const sessions = [
                createSession({ date: '2023-10-24' }),
                createSession({ date: '2023-10-23', id: '2' }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.syncStreak).toBe(2);
        });

        it('should break streak if gap is more than one day', () => {
            const sessions = [
                createSession({ date: '2023-10-25' }),
                createSession({ date: '2023-10-23', id: '2' }), // Gap on 24th
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.syncStreak).toBe(1); // Only today counts as streak was broken yesterday
        });

        it('should handle zero streak correctly if no activity in last two days', () => {
             const sessions = [
                createSession({ date: '2023-10-22' }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.syncStreak).toBe(0);
        });
    });

    describe('weeklyStats', () => {
        it('should calculate weekly stats correctly', () => {
            const sessions = [
                createSession({ date: '2023-10-25', profile: 'el', completion_status: 'completed' }),
                createSession({ date: '2023-10-24', profile: 'ella', completion_status: 'recovery', id: '2' }),
                createSession({ date: '2023-10-10', profile: 'el' }), // Outside week
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));

            expect(result.current.weeklyStats.totalCompleted).toBe(2);
            expect(result.current.weeklyStats.elSessions).toBe(1);
            expect(result.current.weeklyStats.ellaSessions).toBe(1);
            expect(result.current.weeklyStats.recoveryDays).toBe(1);
            expect(result.current.weeklyStats.activeDaysCount).toBe(2);
            expect(result.current.weeklyStats.goalProgressPercentage).toBe(Math.min(100, Math.round((2 / 7) * 100)));
        });
    });

    describe('painAnalytics', () => {
        it('should calculate pain analytics correctly', () => {
             const sessions = [
                createSession({ pain_before: 6, pain_after: 2 }), // diff 4
                createSession({ pain_before: 5, pain_after: 3, id: '2' }), // diff 2
                createSession({ pain_before: undefined, pain_after: undefined, id: '3' }), // ignore
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));

            expect(result.current.painAnalytics).not.toBeNull();
            expect(result.current.painAnalytics?.sessionsCount).toBe(2);
            expect(result.current.painAnalytics?.totalReduction).toBe(6);
            expect(result.current.painAnalytics?.averageBefore).toBe(5.5); // (6+5)/2
            expect(result.current.painAnalytics?.averageAfter).toBe(2.5); // (2+3)/2
        });
    });

    describe('edge cases', () => {
        it('should handle pain values that are exactly 0', () => {
            const sessions = [
                createSession({ pain_before: 0, pain_after: 0 }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.painAnalytics?.averageBefore).toBe(0);
            expect(result.current.painAnalytics?.averageAfter).toBe(0);
        });

        it('should count ella sessions correctly when not el', () => {
             const sessions = [
                createSession({ profile: 'ella', date: mockDateStr }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.weeklyStats.ellaSessions).toBe(1);
            expect(result.current.weeklyStats.elSessions).toBe(0);
        });

        it('should handle session with unhandled profile correctly', () => {
             const sessions = [
                // @ts-ignore - explicitly passing invalid profile for edge case testing
                createSession({ profile: 'unknown', date: mockDateStr }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.weeklyStats.ellaSessions).toBe(0);
            expect(result.current.weeklyStats.elSessions).toBe(0);
            expect(result.current.weeklyStats.totalCompleted).toBe(1); // still completed
        });

        it('should count rest_day towards recoveryDays', () => {
             const sessions = [
                createSession({ completion_status: 'rest_day', date: mockDateStr }),
            ];
            const { result } = renderHook(() => useMovementMetrics(sessions));
            expect(result.current.weeklyStats.recoveryDays).toBe(1);
        });
    });
});
