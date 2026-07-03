import { test, expect } from '@playwright/test';

// Use require.cache to mock module dependencies because Playwright node test runner
// doesn't support easy vi.mock() out of the box for Next.js App Router API routes.

let verifyAuthMock: () => Promise<string | null> = async () => 'el';
let addEventCommentMock: unknown = async () => {};
let reactToEventMock: unknown = async () => {};
let deleteEventCommentMock: unknown = async () => {};
let createServerClientMock: unknown = () => ({});

const setupMocks = () => {
    const authPath = require.resolve('../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: {
            verifyAuth: () => verifyAuthMock()
        }
    } as NodeJS.Module;

    const timelineServicePath = require.resolve('../../../../src/services/timelineService.ts');
    require.cache[timelineServicePath] = {
        id: timelineServicePath,
        filename: timelineServicePath,
        loaded: true,
        exports: {
            TimelineService: {
                addEventComment: (...args: unknown[]) => (addEventCommentMock as (...args: unknown[]) => unknown)(...args),
                reactToEvent: (...args: unknown[]) => (reactToEventMock as (...args: unknown[]) => unknown)(...args),
                deleteEventComment: (...args: unknown[]) => (deleteEventCommentMock as (...args: unknown[]) => unknown)(...args)
            }
        }
    } as NodeJS.Module;

    const supabasePath = require.resolve('../../../../src/lib/supabase.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: createServerClientMock
        }
    } as NodeJS.Module;
};

const cleanupMocks = () => {
    delete require.cache[require.resolve('../../../../src/lib/auth.ts')];
    delete require.cache[require.resolve('../../../../src/services/timelineService.ts')];
    delete require.cache[require.resolve('../../../../src/lib/supabase.ts')];
    delete require.cache[require.resolve('../../../../src/app/api/timeline/route.ts')];
};

test.describe('Timeline API Route', () => {
    test.beforeEach(() => {
        cleanupMocks();
        verifyAuthMock = async () => 'el'; // Authorized by default
        addEventCommentMock = async () => {};
        reactToEventMock = async () => {};
        deleteEventCommentMock = async () => {};
        createServerClientMock = () => ({});
        setupMocks();
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test.describe('POST', () => {
        test('should return 401 if unauthorized', async () => {
            verifyAuthMock = async () => null; // Simulate unauthorized
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { POST } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline', {
                method: 'POST',
                body: JSON.stringify({ action: 'comment', eventId: '1', author: 'el', text: 'hello' })
            });
            const res = await POST(req);

            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: 'Unauthorized' });
        });

        test('should handle "comment" action successfully', async () => {
            let passedPayload: unknown = null;
            addEventCommentMock = async (payload: unknown) => {
                passedPayload = payload;
            };

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { POST } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline', {
                method: 'POST',
                body: JSON.stringify({ action: 'comment', eventId: 'event-1', author: 'el', text: 'Test comment' })
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ success: true });
            expect(passedPayload).toEqual({
                eventId: 'event-1',
                author: 'el',
                text: 'Test comment'
            });
        });

        test('should handle "react" action successfully', async () => {
            let passedId: unknown = null;
            let passedReactions: unknown = null;
            reactToEventMock = async (id: unknown, reactions: unknown) => {
                passedId = id;
                passedReactions = reactions;
            };

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { POST } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline', {
                method: 'POST',
                body: JSON.stringify({ action: 'react', id: 'event-1', reactions: { thumb: 1 } })
            });
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ success: true });
            expect(passedId).toBe('event-1');
            expect(passedReactions).toEqual({ thumb: 1 });
        });

        test('should return 400 for invalid action', async () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { POST } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline', {
                method: 'POST',
                body: JSON.stringify({ action: 'invalid_action' })
            });
            const res = await POST(req);

            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid action' });
        });

        test('should return 500 on internal error', async () => {
            const originalConsoleError = console.error;
            try {
                console.error = () => {}; // suppress error output
                addEventCommentMock = async () => { throw new Error('DB Error'); };

                // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { POST } = require('../../../../src/app/api/timeline/route.ts');

                const req = new Request('http://localhost/api/timeline', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'comment', eventId: 'event-1', author: 'el', text: 'Test' })
                });
                const res = await POST(req);

                expect(res.status).toBe(500);
                expect(await res.json()).toEqual({ error: 'Failed to process request' });
            } finally {
                console.error = originalConsoleError;
            }
        });
    });

    test.describe('DELETE', () => {
        test('should return 401 if unauthorized', async () => {
            verifyAuthMock = async () => null; // Simulate unauthorized
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DELETE } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline?id=comment-1&type=comment', {
                method: 'DELETE'
            });
            const res = await DELETE(req);

            expect(res.status).toBe(401);
            expect(await res.json()).toEqual({ error: 'Unauthorized' });
        });

        test('should return 400 if ID parameter is missing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DELETE } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline?type=comment', {
                method: 'DELETE'
            });
            const res = await DELETE(req);

            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'ID parameter required' });
        });

        test('should return 400 for invalid type', async () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DELETE } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline?id=event-1&type=invalid_type', {
                method: 'DELETE'
            });
            const res = await DELETE(req);

            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid type' });
        });

        test('should successfully delete comment', async () => {
            let passedId: unknown = null;
            deleteEventCommentMock = async (id: unknown) => {
                passedId = id;
            };

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DELETE } = require('../../../../src/app/api/timeline/route.ts');

            const req = new Request('http://localhost/api/timeline?id=comment-1&type=comment', {
                method: 'DELETE'
            });
            const res = await DELETE(req);

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ success: true });
            expect(passedId).toBe('comment-1');
        });

        test('should return 500 on internal error', async () => {
            const originalConsoleError = console.error;
            try {
                console.error = () => {}; // suppress error output
                deleteEventCommentMock = async () => { throw new Error('DB Error'); };

                // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DELETE } = require('../../../../src/app/api/timeline/route.ts');

                const req = new Request('http://localhost/api/timeline?id=comment-1&type=comment', {
                    method: 'DELETE'
                });
                const res = await DELETE(req);

                expect(res.status).toBe(500);
                expect(await res.json()).toEqual({ error: 'Failed to delete resource' });
            } finally {
                console.error = originalConsoleError;
            }
        });
    });
});
