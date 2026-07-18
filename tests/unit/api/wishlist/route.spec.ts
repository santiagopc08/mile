import { test, expect } from '@playwright/test';

const setupMocks = (
    verifyAuthMock: unknown,
    supabaseMock: unknown,
    wishlistUpdateStateMock: unknown,
    wishlistAddContributionMock: unknown,
    wishlistToggleReactionMock: unknown,
    notificationAddMock: unknown
) => {
    const authPath = require.resolve('../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: { verifyAuth: verifyAuthMock }
    } as NodeJS.Module;

    const supabasePath = require.resolve('../../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: { createServerClient: () => supabaseMock }
    } as NodeJS.Module;

    const wishlistServicePath = require.resolve('../../../../src/services/wishlistService.ts');
    require.cache[wishlistServicePath] = {
        id: wishlistServicePath,
        filename: wishlistServicePath,
        loaded: true,
        exports: {
            WishlistService: {
                updateWishlistState: wishlistUpdateStateMock,
                addContribution: wishlistAddContributionMock,
                toggleReaction: wishlistToggleReactionMock,
            }
        }
    } as NodeJS.Module;

    const notificationServicePath = require.resolve('../../../../src/services/notificationService.ts');
    require.cache[notificationServicePath] = {
        id: notificationServicePath,
        filename: notificationServicePath,
        loaded: true,
        exports: {
            NotificationService: {
                addNotification: notificationAddMock
            }
        }
    } as NodeJS.Module;
};

const cleanupMocks = () => {
    delete require.cache[require.resolve('../../../../src/lib/auth.ts')];
    delete require.cache[require.resolve('../../../../src/lib/supabase-server.ts')];
    delete require.cache[require.resolve('../../../../src/services/wishlistService.ts')];
    delete require.cache[require.resolve('../../../../src/services/notificationService.ts')];
    delete require.cache[require.resolve('../../../../src/app/api/wishlist/route.ts')];
};

test.describe('Wishlist API Route', () => {
    let originalConsoleError: typeof console.error;

    test.beforeEach(() => {
        cleanupMocks();
        originalConsoleError = console.error;
    });

    test.afterEach(() => {
        cleanupMocks();
        console.error = originalConsoleError;
    });

    test('should return 401 if unauthorized', async () => {
        setupMocks(
            async () => false, // verifyAuth -> false
            {}, null, null, null, null
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'reaction' })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('state_transition: should update state and notify if shared', async () => {
        const itemMock = { id: 'item1', title: 'Test Plan', shared: true, state: 'DISCOVERED' };

        let notificationTarget, notificationType, notificationMsg;
        let stateUpdatedTo;

        const supabaseMock = {
            from: (_table: string) => ({
                select: (_cols: string) => ({
                    eq: (_field: string, _val: unknown) => ({
                        single: async () => ({ data: itemMock, error: null })
                    })
                })
            })
        };

        setupMocks(
            async () => true, // verifyAuth
            supabaseMock,
            async (itemId: string, nextState: string, _profile: string, _sb: unknown) => {
                stateUpdatedTo = nextState;
            },
            null, null,
            async (target: string, type: string, msg: string, _sb: unknown) => {
                notificationTarget = target;
                notificationType = type;
                notificationMsg = msg;
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'state_transition', itemId: 'item1', profile: 'el', nextState: 'COMPLETED' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true });

        expect(stateUpdatedTo).toBe('COMPLETED');
        expect(notificationTarget).toBe('ella');
        expect(notificationType).toBe('wishlist');
        expect(notificationMsg).toContain('Objetivo Cumplido!');
        expect(notificationMsg).toContain('Test Plan');
    });

    test('state_transition: should handle non-shared item (no notification)', async () => {
        const itemMock = { id: 'item1', title: 'Test Plan', shared: false, state: 'DISCOVERED' };

        let notificationCalled = false;

        const supabaseMock = {
            from: () => ({ select: () => ({ eq: () => ({
                single: async () => ({ data: itemMock, error: null })
            })})})
        };

        setupMocks(
            async () => true,
            supabaseMock,
            async () => {}, // mock update state
            null, null,
            async () => { notificationCalled = true; } // mock notification
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'state_transition', itemId: 'item1', profile: 'el', nextState: 'SAVING' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(notificationCalled).toBe(false);
    });

    test('state_transition: should return 404 if item not found', async () => {
        const supabaseMock = {
            from: () => ({ select: () => ({ eq: () => ({
                single: async () => ({ data: null, error: { message: 'Not found' } })
            })})})
        };

        setupMocks(async () => true, supabaseMock, null, null, null, null);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'state_transition', itemId: 'item1', profile: 'el', nextState: 'SAVING' })
        });

        const res = await POST(req);
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toEqual({ error: 'Item not found' });
    });

    test('contribute: should add contribution, handle DISCOVERED auto-transition and notifications', async () => {
        const itemMock = { id: 'item1', title: 'Trip', shared: true, state: 'DISCOVERED', saved_amount: 0, price: 100000 };

        let contributionAmount;
        const statesUpdated: string[] = [];
        let notificationMsg;

        const supabaseMock = {
            from: () => ({ select: () => ({ eq: () => ({
                single: async () => ({ data: itemMock, error: null })
            })})})
        };

        setupMocks(
            async () => true,
            supabaseMock,
            async (itemId: string, nextState: string) => { statesUpdated.push(nextState); },
            async (itemId: string, profile: string, amount: number) => { contributionAmount = amount; },
            null,
            async (target: string, type: string, msg: string) => { notificationMsg = msg; }
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'contribute', itemId: 'item1', profile: 'ella', amount: 50000, note: 'saving' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        expect(contributionAmount).toBe(50000);
        expect(statesUpdated).toEqual(['SAVING']); // Auto-transition from DISCOVERED to SAVING
        expect(notificationMsg).toContain('Milena aportó'); // 'ella' is Milena
        expect(notificationMsg).toContain('50.000');
    });

    test('contribute: should transition to READY_TO_DEPLOY when price reached', async () => {
        const itemMock = { id: 'item1', title: 'Trip', shared: false, state: 'SAVING', saved_amount: 80000, price: 100000 };
        const statesUpdated: string[] = [];

        const supabaseMock = {
            from: () => ({ select: () => ({ eq: () => ({
                single: async () => ({ data: itemMock, error: null })
            })})})
        };

        setupMocks(
            async () => true,
            supabaseMock,
            async (itemId: string, nextState: string) => { statesUpdated.push(nextState); },
            async () => {},
            null, null
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'contribute', itemId: 'item1', profile: 'ella', amount: 30000, note: 'yay' })
        });

        await POST(req);
        // 80000 + 30000 >= 100000
        expect(statesUpdated).toEqual(['READY_TO_DEPLOY']);
    });

    test('contribute: should return 404 if item not found', async () => {
        const supabaseMock = {
            from: () => ({ select: () => ({ eq: () => ({
                single: async () => ({ data: null, error: { message: 'Not found' } })
            })})})
        };

        setupMocks(async () => true, supabaseMock, null, null, null, null);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'contribute', itemId: 'item1', profile: 'ella', amount: 30000 })
        });

        const res = await POST(req);
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toEqual({ error: 'Item not found' });
    });

    test('reaction: should toggle reaction', async () => {
        let reactionToggled = false;
        setupMocks(
            async () => true,
            {}, null, null,
            async () => { reactionToggled = true; },
            null
        );

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'reaction', itemId: 'item1', profile: 'el', type: 'like' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(reactionToggled).toBe(true);
    });

    test('should return 400 for invalid action', async () => {
        setupMocks(async () => true, {}, null, null, null, null);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
        const req = new Request('http://localhost/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ action: 'invalid_action' })
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid action' });
    });

    test('should return 500 on internal error', async () => {
        setupMocks(
            async () => { throw new Error('DB Crash'); },
            {}, null, null, null, null
        );
        console.error = () => {}; // suppress error output

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/wishlist/route.ts');
            const req = new Request('http://localhost/api/wishlist', {
                method: 'POST',
                body: JSON.stringify({ action: 'reaction' })
            });

            const res = await POST(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data).toEqual({ error: 'DB Crash' });
        } finally {
            // will be restored in afterEach
        }
    });
});
