import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';

// Setup environment before importing anything
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'dummy');

describe('HealthService', () => {
    let mockSupabase: unknown;

    let insertMock: ReturnType<typeof vi.fn>;
    let upsertMock: ReturnType<typeof vi.fn>;

    let deleteMock: ReturnType<typeof vi.fn>;
    let eqMock: ReturnType<typeof vi.fn>;
    let HealthService: typeof import('../../../src/services/healthService').HealthService;

    beforeEach(async () => {
        vi.resetModules();
        HealthService = (await import('../../../src/services/healthService')).HealthService;


        insertMock = vi.fn().mockResolvedValue({ error: null });
        upsertMock = vi.fn().mockResolvedValue({ error: null });

        eqMock = vi.fn().mockResolvedValue({ error: null });
        deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

        mockSupabase = {
            from: vi.fn().mockReturnValue({
                insert: insertMock,
                upsert: upsertMock,
                delete: deleteMock,
            }),
        };
    });

    describe('logHealthHabit', () => {
        it('should format date correctly and log health habit without a note', async () => {
            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const expectedDate = localDate.toISOString().split('T')[0];

            await HealthService.logHealthHabit(
                'user123',
                'junk_food',
                10,
                'medium',
                undefined,
                mockSupabase as SupabaseClient
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('health_habits');
            expect(insertMock).toHaveBeenCalledWith({
                profile: 'user123',
                date: expectedDate,
                habit_type: 'junk_food',
                cost: 10,
                severity: 'medium',
                note: null,
            });
        });

        it('should log health habit with a note', async () => {
            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const expectedDate = localDate.toISOString().split('T')[0];

            await HealthService.logHealthHabit(
                'user456',
                'snacks',
                5,
                'high',
                'Feeling great!',
                mockSupabase as SupabaseClient
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('health_habits');
            expect(insertMock).toHaveBeenCalledWith({
                profile: 'user456',
                date: expectedDate,
                habit_type: 'snacks',
                cost: 5,
                severity: 'high',
                note: 'Feeling great!',
            });
        });
    });

    describe('deleteHealthHabit', () => {
        it('should delete health habit by id', async () => {
            await HealthService.deleteHealthHabit('habit-id-789', mockSupabase as SupabaseClient);

            expect(mockSupabase.from).toHaveBeenCalledWith('health_habits');
            expect(deleteMock).toHaveBeenCalled();
            expect(eqMock).toHaveBeenCalledWith('id', 'habit-id-789');
        });
    });

    describe('updateDailyTracking', () => {
        it('should upsert daily tracking data correctly', async () => {
            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const expectedDate = localDate.toISOString().split('T')[0];

            await HealthService.updateDailyTracking(
                'el',
                { weight: 70, sleep_hours: 8 },
                mockSupabase as SupabaseClient
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('daily_tracking');
            expect(upsertMock).toHaveBeenCalledWith(
                {
                    profile: 'el',
                    date: expectedDate,
                    weight: 70,
                    sleep_hours: 8
                },
                { onConflict: 'profile,date' }
            );
        });
    });

});
