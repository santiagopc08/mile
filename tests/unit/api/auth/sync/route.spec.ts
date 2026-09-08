import { test, expect } from '@playwright/test';

const setupMocks = (
    cookieValue: string | undefined,
    supabaseGetUserMock: any,
    supabaseFromMock?: any,
    cookieSetMock?: any
) => {
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            cookies: async () => ({
                get: (name: string) => {
                    if (name === 'mile_device_token' && cookieValue) return { value: cookieValue };
                    return undefined;
                },
                set: cookieSetMock || (() => {})
            })
        }
    } as any;

    const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
                auth: {
                    getUser: supabaseGetUserMock
                },
                from: supabaseFromMock || (() => ({}))
            })
        }
    } as any;
};

const cleanupMocks = () => {
    const nextHeadersPath = require.resolve('next/headers');
    delete require.cache[nextHeadersPath];
    const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
    delete require.cache[supabasePath];

    try {
        const routePath = require.resolve('../../../../../src/app/api/auth/sync/route.ts');
        delete require.cache[routePath];
    } catch (e) {}
};

test.describe('Auth Sync API', () => {

    test.beforeEach(() => {
        cleanupMocks();
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 401 if auth header is missing', async () => {
        setupMocks(undefined, async () => ({}));

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 401 if auth header does not start with Bearer', async () => {
        setupMocks(undefined, async () => ({}));

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Basic token' }
        });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 401 if getUser returns error', async () => {
        setupMocks(undefined, async () => ({ error: new Error('Invalid token'), data: { user: null } }));

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer invalid_token' }
        });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 401 if user email is not in allowed list', async () => {
        setupMocks(undefined, async () => ({ error: null, data: { user: { email: 'hacker@example.com' } } }));

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer token' }
        });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    test('should return 200 and success with existing device token', async () => {
        let cookieSetParams: any = null;
        setupMocks('existing_token',
            async () => ({ error: null, data: { user: { email: 'ella@mile.app' } } }),
            null,
            (name: string, value: string, options: any) => {
                cookieSetParams = { name, value, options };
            }
        );

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer valid_token' }
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, profile: 'ella' });

        expect(cookieSetParams).not.toBeNull();
        expect(cookieSetParams.name).toBe('mile_device_token');
        expect(cookieSetParams.value).toBe('existing_token');
        expect(cookieSetParams.options.maxAge).toBe(60 * 60 * 24 * 365);
    });

    test('should return 500 if inserting new device token fails', async () => {
        const mockFrom = (table: string) => {
            if (table === 'device_tokens') {
                return {
                    insert: async () => ({ error: new Error('DB Error') })
                };
            }
            return {};
        };

        setupMocks(undefined,
            async () => ({ error: null, data: { user: { id: 'user_1', email: 'el@mile.app' } } }),
            mockFrom
        );

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer valid_token' }
        });

        // suppress console.error for this test
        const originalError = console.error;
        console.error = () => {};

        const res = await POST(req);
        console.error = originalError;

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });

    test('should generate new token, insert it, cleanup old ones, and return 200', async () => {
        let insertedData: any = null;
        let deletedTokens: string[] = [];
        let cookieSetParams: any = null;

        const mockFrom = (table: string) => {
            if (table === 'device_tokens') {
                return {
                    insert: async (data: any) => {
                        insertedData = data;
                        return { error: null };
                    },
                    select: () => ({
                        eq: () => ({
                            order: async () => ({
                                // Return 6 existing tokens
                                data: [
                                    { id: 't1' }, { id: 't2' }, { id: 't3' },
                                    { id: 't4' }, { id: 't5' }, { id: 't6' }
                                ]
                            })
                        })
                    }),
                    delete: () => ({
                        in: async (column: string, values: string[]) => {
                            if (column === 'id') {
                                deletedTokens = values;
                            }
                            return { error: null };
                        }
                    })
                };
            }
            return {};
        };

        setupMocks(undefined,
            async () => ({ error: null, data: { user: { id: 'user_1', email: 'ella@mile.app' } } }),
            mockFrom,
            (name: string, value: string, options: any) => {
                cookieSetParams = { name, value, options };
            }
        );

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer valid_token' }
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, profile: 'ella' });

        expect(insertedData).not.toBeNull();
        expect(insertedData.user_id).toBe('user_1');
        expect(typeof insertedData.token).toBe('string');

        // It should delete the 6th token since limit is 5
        expect(deletedTokens).toEqual(['t6']);

        expect(cookieSetParams).not.toBeNull();
        expect(cookieSetParams.name).toBe('mile_device_token');
        expect(cookieSetParams.value).toBe(insertedData.token);
    });

    test('should catch general exceptions and return 500', async () => {
        // Setup a mock that throws an error when cookies() is called, for instance
        const nextHeadersPath = require.resolve('next/headers');
        require.cache[nextHeadersPath] = {
            id: nextHeadersPath,
            filename: nextHeadersPath,
            loaded: true,
            exports: {
                cookies: () => { throw new Error('Unexpected error'); }
            }
        } as any;

        const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
        require.cache[supabasePath] = {
            id: supabasePath,
            filename: supabasePath,
            loaded: true,
            exports: {
                createServerClient: () => ({
                    auth: {
                        getUser: async () => ({ error: null, data: { user: { email: 'el@mile.app' } } })
                    }
                })
            }
        } as any;

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer valid_token' }
        });

        const originalError = console.error;
        console.error = () => {}; // suppress output
        const res = await POST(req);
        console.error = originalError;

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });

    test('should catch exceptions when creating server client and return 500', async () => {
        setupMocks(undefined, async () => ({}));

        const supabasePath = require.resolve('../../../../../src/lib/supabase-server.ts');
        require.cache[supabasePath] = {
            id: supabasePath,
            filename: supabasePath,
            loaded: true,
            exports: {
                createServerClient: () => {
                    throw new Error('Supabase client creation failed');
                }
            }
        } as any;

        const { POST } = require('../../../../../src/app/api/auth/sync/route.ts');
        const req = new Request('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: { 'authorization': 'Bearer valid_token' }
        });

        const originalError = console.error;
        console.error = () => {};
        const res = await POST(req);
        console.error = originalError;

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});
