import { test, expect } from '@playwright/test';
import { NotificationService } from '../../../src/services/notificationService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabase = (mockData: Record<string, any> = {}, mockError: unknown = null) => {
    let mockFetchCalled = false;
    let mockFetchData: unknown = null;

    // Mock global fetch
    const originalFetch = global.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.fetch = async (url: any, init?: any) => {
        mockFetchCalled = true;
        mockFetchData = init ? JSON.parse(init.body) : null;
        return new Response(JSON.stringify({ success: true }));
    };

    // Mock window to simulate browser environment since service checks typeof window !== 'undefined'
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {};

    const chainable = {
        select: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        eq: () => chainable,
        single: () => chainable,
        in: () => chainable,
        match: () => chainable,
        insert: () => chainable,
        update: () => chainable,
        delete: () => chainable,
        upsert: () => chainable,
        not: () => chainable,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: (resolve: any) => resolve({ data: mockData.default || [], error: mockError }),
    };

    const mockSupabase = {
        from: (table: string) => {
            const tableChainable = { ...chainable };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const wrapWithThen = (base: any, isSingle: boolean = false) => {
                const wrapped = { ...base };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                wrapped.then = (resolve: any) => {
                     let data = mockData[table];
                     if (isSingle) {
                        data = Array.isArray(data) ? data[0] : data;
                     }
                     resolve({ data: data || (isSingle ? null : []), error: mockError });
                };
                return wrapped;
            };

            tableChainable.select = () => wrapWithThen({ ...tableChainable, single: () => wrapWithThen({ ...tableChainable }, true) });
            tableChainable.update = () => wrapWithThen({ ...tableChainable });
            tableChainable.insert = () => wrapWithThen({ ...tableChainable, select: () => wrapWithThen({ ...tableChainable, single: () => wrapWithThen({ ...tableChainable }, true) }) });

            tableChainable.order = () => wrapWithThen({ ...tableChainable });
            tableChainable.eq = () => wrapWithThen({ ...tableChainable, order: () => wrapWithThen({...tableChainable}) });

            return tableChainable;
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockSupabase._restoreMocks = () => {
        global.fetch = originalFetch;
        global.window = originalWindow;
    };
    mockSupabase._getFetchData = () => ({ mockFetchCalled, mockFetchData });

    return mockSupabase;
};

test.describe('NotificationService', () => {

    test('getNotifications should return notifications for a profile', async () => {
        const mockNotifications = [
            { id: '1', target_profile: 'test_user', message: 'Hello', read: false },
            { id: '2', target_profile: 'test_user', message: 'World', read: true }
        ];
        const supabase = createMockSupabase({ notifications: mockNotifications });

        const result = await NotificationService.getNotifications('test_user', supabase);

        expect(result).toEqual(mockNotifications);

        supabase._restoreMocks();
    });

    test('getNotifications should return empty array when no data', async () => {
        const supabase = createMockSupabase({ notifications: null });

        const result = await NotificationService.getNotifications('test_user', supabase);

        expect(result).toEqual([]);

        supabase._restoreMocks();
    });

    test('markNotificationRead should update notification to read', async () => {
        const supabase = createMockSupabase();

        await expect(NotificationService.markNotificationRead('1', supabase)).resolves.toBeUndefined();

        supabase._restoreMocks();
    });

    test('addNotification should insert and trigger fetch', async () => {
        const mockNotification = {
            id: '1',
            target_profile: 'test_user',
            type: 'alert',
            message: 'Test alert'
        };
        const supabase = createMockSupabase({ notifications: [mockNotification] });

        await NotificationService.addNotification('test_user', 'alert', 'Test alert', supabase);

        const { mockFetchCalled, mockFetchData } = supabase._getFetchData();
        expect(mockFetchCalled).toBe(true);
        expect(mockFetchData).toEqual({
            target: 'test_user',
            message: 'Test alert',
            type: 'alert'
        });

        supabase._restoreMocks();
    });

    test('addNotification should not trigger fetch on error', async () => {
        const supabase = createMockSupabase({}, { message: 'Insert failed' });

        await NotificationService.addNotification('test_user', 'alert', 'Test alert', supabase);

        const { mockFetchCalled } = supabase._getFetchData();
        expect(mockFetchCalled).toBe(false);

        supabase._restoreMocks();
    });
});
