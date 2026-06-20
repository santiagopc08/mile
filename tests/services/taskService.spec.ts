import { test, expect } from '@playwright/test';
import { TaskService } from '../../src/services/taskService';

const createMockSupabase = (
    mockData: unknown,
    onUpdate: (table: string, payload: Record<string, unknown>, eqKey: string, eqVal: string) => void
) => {
    return {
        from: (table: string) => {
            const chainableSelect = {
                eq: () => chainableSelect,
                single: () => ({
                    then: (resolve: (value: unknown) => void) => resolve({ data: mockData, error: null }),
                }),
            };

            return {
                select: () => chainableSelect,
                update: (payload: Record<string, unknown>) => {
                    const chainableUpdate = {
                        eq: (k: string, v: string) => {
                            onUpdate(table, payload, k, v);
                            return { then: (resolve: (value: unknown) => void) => resolve({ error: null }) };
                        },
                    };
                    return chainableUpdate;
                },
            };
        },
    } as unknown as import("@supabase/supabase-js").SupabaseClient;
};

test.describe('TaskService.updateTaskActualTime', () => {
    test('should fetch task and update actual_time by adding additional minutes', async () => {
        let updateTable = '';
        let updatePayload: Record<string, unknown> = {};
        let updateEqKey = '';
        let updateEqVal = '';

        const mockTask = { actual_time: 15 };
        const mockSupabase = createMockSupabase(
            mockTask,
            (table, payload, eqKey, eqVal) => {
                updateTable = table;
                updatePayload = payload;
                updateEqKey = eqKey;
                updateEqVal = eqVal;
            }
        );

        await TaskService.updateTaskActualTime('task-123', 30, mockSupabase);

        expect(updateTable).toBe('tasks');
        expect(Object.keys(updatePayload).length).toBeGreaterThan(0);
        expect(updatePayload.actual_time as number).toBe(45);
        expect(updatePayload.updated_at as string).toBeDefined();
        expect(updateEqKey).toBe('id');
        expect(updateEqVal).toBe('task-123');
    });

    test('should treat null or undefined actual_time as 0 when updating', async () => {
        let updatePayload: Record<string, unknown> = {};

        const mockTask = { actual_time: null };
        const mockSupabase = createMockSupabase(
            mockTask,
            (_, payload) => {
                updatePayload = payload;
            }
        );

        await TaskService.updateTaskActualTime('task-123', 20, mockSupabase);

        expect(updatePayload.actual_time as number).toBe(20);
    });

    test('should not call update if the task is not found', async () => {
        let updateCalled = false;

        const mockSupabase = createMockSupabase(
            null, // task not found
            () => {
                updateCalled = true;
            }
        );

        await TaskService.updateTaskActualTime('task-123', 30, mockSupabase);

        expect(updateCalled).toBe(false);
    });
});

test.describe('TaskService.updateTaskStatus', () => {
    test('should map "todo" status to "pending" in the database', async () => {
        let updateTable = '';
        let updatePayload: Record<string, unknown> = {};
        let updateEqKey = '';
        let updateEqVal = '';

        const mockSupabase = createMockSupabase(
            null,
            (table, payload, eqKey, eqVal) => {
                updateTable = table;
                updatePayload = payload;
                updateEqKey = eqKey;
                updateEqVal = eqVal;
            }
        );

        await TaskService.updateTaskStatus('task-456', 'todo', mockSupabase);

        expect(updateTable).toBe('tasks');
        expect(updatePayload.status as string).toBe('pending');
        expect(updatePayload.updated_at as string).toBeDefined();
        expect(updateEqKey).toBe('id');
        expect(updateEqVal).toBe('task-456');
    });

    test('should pass "in_progress" status directly to the database', async () => {
        let updatePayload: Record<string, unknown> = {};

        const mockSupabase = createMockSupabase(
            null,
            (_, payload) => {
                updatePayload = payload;
            }
        );

        await TaskService.updateTaskStatus('task-456', 'in_progress', mockSupabase);

        expect(updatePayload.status as string).toBe('in_progress');
    });

    test('should pass "done" status directly to the database', async () => {
        let updatePayload: Record<string, unknown> = {};

        const mockSupabase = createMockSupabase(
            null,
            (_, payload) => {
                updatePayload = payload;
            }
        );

        await TaskService.updateTaskStatus('task-456', 'done', mockSupabase);

        expect(updatePayload.status as string).toBe('done');
    });
});
