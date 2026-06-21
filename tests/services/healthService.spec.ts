import { test, expect } from '@playwright/test';
import { HealthService } from '../../src/services/healthService';

const createMockSupabase = (
    onInsert: (table: string, payload: Record<string, unknown>) => void,
    onDelete: (table: string, eqKey: string, eqVal: string) => void
) => {
    return {
        from: (table: string) => {
            return {
                insert: (payload: Record<string, unknown>) => {
                    onInsert(table, payload);
                    return { then: (resolve: (value: unknown) => void) => resolve({ error: null }) };
                },
                delete: () => {
                    return {
                        eq: (k: string, v: string) => {
                            onDelete(table, k, v);
                            return { then: (resolve: (value: unknown) => void) => resolve({ error: null }) };
                        }
                    };
                }
            };
        },
    } as unknown as import("@supabase/supabase-js").SupabaseClient;
};

test.describe('HealthService', () => {
    test.describe('logHealthHabit', () => {
        test('should format date correctly and log health habit without a note', async () => {
            let insertTable = '';
            let insertPayload: Record<string, unknown> = {};

            const mockSupabase = createMockSupabase(
                (table, payload) => {
                    insertTable = table;
                    insertPayload = payload;
                },
                () => {}
            );

            await HealthService.logHealthHabit('user123', 'junk_food', 10, 'medium', undefined, mockSupabase);

            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const expectedDate = localDate.toISOString().split('T')[0];

            expect(insertTable).toBe('health_habits');
            expect(insertPayload).toEqual({
                profile: 'user123',
                date: expectedDate,
                habit_type: 'junk_food',
                cost: 10,
                severity: 'medium',
                note: null
            });
        });

        test('should log health habit with a note', async () => {
            let insertTable = '';
            let insertPayload: Record<string, unknown> = {};

            const mockSupabase = createMockSupabase(
                (table, payload) => {
                    insertTable = table;
                    insertPayload = payload;
                },
                () => {}
            );

            await HealthService.logHealthHabit('user456', 'snacks', 5, 'high', 'Feeling great!', mockSupabase);

            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const expectedDate = localDate.toISOString().split('T')[0];

            expect(insertTable).toBe('health_habits');
            expect(insertPayload).toEqual({
                profile: 'user456',
                date: expectedDate,
                habit_type: 'snacks',
                cost: 5,
                severity: 'high',
                note: 'Feeling great!'
            });
        });
    });

    test.describe('deleteHealthHabit', () => {
        test('should delete health habit by id', async () => {
            let deleteTable = '';
            let deleteEqKey = '';
            let deleteEqVal = '';

            const mockSupabase = createMockSupabase(
                () => {},
                (table, eqKey, eqVal) => {
                    deleteTable = table;
                    deleteEqKey = eqKey;
                    deleteEqVal = eqVal;
                }
            );

            await HealthService.deleteHealthHabit('habit-id-789', mockSupabase);

            expect(deleteTable).toBe('health_habits');
            expect(deleteEqKey).toBe('id');
            expect(deleteEqVal).toBe('habit-id-789');
        });
    });
});
