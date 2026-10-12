import { test, expect } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
const setupMocks = (authResult: boolean = true, supabaseMock: any = {}, webpushMock: any = {}) => {
    const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = { id: supabasePath, filename: supabasePath, loaded: true, exports: { createServerClient: () => supabaseMock } } as any;
    const authPath = require.resolve('../../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: {
            verifyAuth: async () => authResult
        }
    } as any;

    const webPushPath = require.resolve('web-push');
    require.cache[webPushPath] = {
        id: webPushPath,
        filename: webPushPath,
        loaded: true,
        exports: {
            setVapidDetails: () => {},
            sendNotification: async () => {},
            ...webpushMock
        }
    } as any;
};

const cleanupMocks = () => {
    const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
    delete require.cache[supabasePath];
    const authPath = require.resolve('../../../../../src/lib/auth.ts');
    delete require.cache[authPath];
    const webPushPath = require.resolve('web-push');
    delete require.cache[webPushPath];
    const routePath = require.resolve('../../../../../src/app/api/push/send/route.ts');
    delete require.cache[routePath];
};

test.describe('Push Send API Validation', () => {

    test.beforeEach(() => {
        cleanupMocks();
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test';
        process.env.VAPID_PRIVATE_KEY = 'test';
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 400 for non-string target', async () => {
        setupMocks(true);

        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 123, message: 'valid message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid input types' });
    });

    test('should return 400 for non-string message', async () => {
        setupMocks(true);

        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'valid target', message: { object: true } })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid input types' });
    });

    test('should return 400 for target length > 50', async () => {
        setupMocks(true);

        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'a'.repeat(51), message: 'valid message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Input exceeds maximum length' });
    });

    test('should return 400 for message length > 1000', async () => {
        setupMocks(true);

        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'valid target', message: 'a'.repeat(1001) })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Input exceeds maximum length' });
    });

    test('should return 401 if not authorized', async () => {
        setupMocks(false);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target', message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(401);
    });

    test('should return 400 if target missing', async () => {
        setupMocks(true);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
    });

    test('should return 400 if message missing', async () => {
        setupMocks(true);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
    });

    test('should return 500 if push service not configured', async () => {
        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        setupMocks(true);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target', message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Push service not configured' });
    });

    test('should return 500 if supabase fetch fails', async () => {
        const supabaseMock = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        data: null,
                        error: new Error('Database error')
                    })
                })
            })
        };
        setupMocks(true, supabaseMock);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target', message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Failed to fetch subscriptions' });
    });

    test('should return 200 with 0 sent if no subscriptions found', async () => {
        const supabaseMock = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        data: [],
                        error: null
                    })
                })
            })
        };
        setupMocks(true, supabaseMock);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target', message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, sent: 0, message: 'No subscriptions found for target' });
    });

    test('should handle webpush send errors and delete subscriptions on 410/404', async () => {
        let deletedIds: string[] | undefined;
        const supabaseMock = {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        data: [
                            { id: '1', subscription: { endpoint: '1' }, profile: 'target' },
                            { id: '2', subscription: { endpoint: '2' }, profile: 'target' },
                            { id: '3', subscription: { endpoint: '3' }, profile: 'target' }
                        ],
                        error: null
                    })
                }),
                delete: () => ({
                    in: (col: string, ids: string[]) => {
                        deletedIds = ids;
                        return { error: null };
                    }
                })
            })
        };

        const webpushMock = {
            sendNotification: async (sub: any) => {
                if (sub.endpoint === '1') throw { statusCode: 410 };
                if (sub.endpoint === '2') throw { statusCode: 404 };
                if (sub.endpoint === '3') throw new Error('Other error');
            }
        };

        setupMocks(true, supabaseMock, webpushMock);
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'target', message: 'message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, sent: 3 });

        expect(deletedIds).toEqual(['1', '2']);
    });
});
