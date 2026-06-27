import { test, expect } from '@playwright/test';

const setupMocks = (
    verifyAuthMock: boolean,
    timelineServiceMock: Record<string, unknown>
) => {
    // Mock @/lib/auth
    const authPath = require.resolve('../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: {
            verifyAuth: async () => verifyAuthMock
        }
    } as NodeJS.Module;

    // Mock @/lib/supabase
    const supabasePath = require.resolve('../../../../src/lib/supabase.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({})
        }
    } as NodeJS.Module;

    // Mock @/services/timelineService
    const timelineServicePath = require.resolve('../../../../src/services/timelineService.ts');
    require.cache[timelineServicePath] = {
        id: timelineServicePath,
        filename: timelineServicePath,
        loaded: true,
        exports: {
            TimelineService: timelineServiceMock
        }
    } as NodeJS.Module;
};

const cleanupMocks = () => {
    const authPath = require.resolve('../../../../src/lib/auth.ts');
    delete require.cache[authPath];
    const supabasePath = require.resolve('../../../../src/lib/supabase.ts');
    delete require.cache[supabasePath];
    const timelineServicePath = require.resolve('../../../../src/services/timelineService.ts');
    delete require.cache[timelineServicePath];

    const routePath = require.resolve('../../../../src/app/api/timeline/route.ts');
    delete require.cache[routePath];
};

test.describe('Timeline API POST', () => {
    test.beforeEach(() => {
        cleanupMocks();
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 401 if unauthorized', async () => {
        setupMocks(false, {});

        const { POST } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline', {
            method: 'POST',
            body: JSON.stringify({ action: 'comment' })
        });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 400 if invalid action', async () => {
        setupMocks(true, {});

        const { POST } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline', {
            method: 'POST',
            body: JSON.stringify({ action: 'invalid_action' })
        });
        const res = await POST(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid action' });
    });

    test('should call TimelineService.addEventComment and return 200 on comment action', async () => {
        let calledPayload: Record<string, unknown> | null = null;
        setupMocks(true, {
            addEventComment: async (payload: Record<string, unknown>) => { calledPayload = payload; }
        });

        const { POST } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline', {
            method: 'POST',
            body: JSON.stringify({
                action: 'comment',
                eventId: 'event_1',
                author: 'el',
                text: 'hello'
            })
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true });
        expect(calledPayload).toEqual({
            eventId: 'event_1',
            author: 'el',
            text: 'hello'
        });
    });

    test('should call TimelineService.reactToEvent and return 200 on react action', async () => {
        let calledId: string | null = null;
        let calledReactions: Record<string, unknown> | null = null;
        setupMocks(true, {
            reactToEvent: async (id: string, reactions: Record<string, unknown>) => {
                calledId = id;
                calledReactions = reactions;
            }
        });

        const { POST } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline', {
            method: 'POST',
            body: JSON.stringify({
                action: 'react',
                id: 'event_2',
                reactions: { el: 'heart' }
            })
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true });
        expect(calledId).toBe('event_2');
        expect(calledReactions).toEqual({ el: 'heart' });
    });

    test('should return 500 if an error occurs', async () => {
        setupMocks(true, {
            addEventComment: async () => { throw new Error('DB Error'); }
        });

        // suppress console.error for this test
        const originalError = console.error;
        console.error = () => {};

        try {
            const { POST } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
            const req = new Request('http://localhost:3000/api/timeline', {
                method: 'POST',
                body: JSON.stringify({ action: 'comment' })
            });
            const res = await POST(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data).toEqual({ error: 'Failed to process request' });
        } finally {
            console.error = originalError;
        }
    });
});

test.describe('Timeline API DELETE', () => {
    test.beforeEach(() => {
        cleanupMocks();
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 401 if unauthorized', async () => {
        setupMocks(false, {});

        const { DELETE } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline?id=123&type=comment', { method: 'DELETE' });
        const res = await DELETE(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 400 if ID is missing', async () => {
        setupMocks(true, {});

        const { DELETE } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline?type=comment', { method: 'DELETE' });
        const res = await DELETE(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'ID parameter required' });
    });

    test('should return 400 if type is invalid', async () => {
        setupMocks(true, {});

        const { DELETE } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline?id=123&type=invalid_type', { method: 'DELETE' });
        const res = await DELETE(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid type' });
    });

    test('should call TimelineService.deleteEventComment and return 200 on comment type', async () => {
        let calledId: string | null = null;
        setupMocks(true, {
            deleteEventComment: async (id: string) => { calledId = id; }
        });

        const { DELETE } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
        const req = new Request('http://localhost:3000/api/timeline?id=event_3&type=comment', { method: 'DELETE' });
        const res = await DELETE(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true });
        expect(calledId).toBe('event_3');
    });

    test('should return 500 if an error occurs', async () => {
        setupMocks(true, {
            deleteEventComment: async () => { throw new Error('DB Error'); }
        });

        const originalError = console.error;
        console.error = () => {};

        try {
            const { DELETE } = // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../src/app/api/timeline/route.ts');
            const req = new Request('http://localhost:3000/api/timeline?id=event_4&type=comment', { method: 'DELETE' });
            const res = await DELETE(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data).toEqual({ error: 'Failed to delete resource' });
        } finally {
            console.error = originalError;
        }
    });
});
