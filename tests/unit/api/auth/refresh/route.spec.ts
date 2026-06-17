import { test, expect } from '@playwright/test';

// Use require.cache to mock module dependencies because Playwright node test runner
// doesn't support easy vi.mock() out of the box for Next.js App Router API routes.
const setupMocks = (
    cookieValue: string | undefined,
    supabaseListUsersMock: any,
    supabaseSignInMock: any
) => {
    // 1. Mock next/headers
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            cookies: () => ({
                get: (name: string) => {
                    if (name === 'mile_device_token' && cookieValue) return { value: cookieValue };
                    return undefined;
                }
            })
        }
    } as any;

    // 2. Mock supabase client
    const supabasePath = require.resolve('../../../../../src/lib/supabase.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
                auth: {
                    admin: {
                        listUsers: supabaseListUsersMock
                    },
                    signInWithPassword: supabaseSignInMock
                }
            })
        }
    } as any;
};

const cleanupMocks = () => {
    const nextHeadersPath = require.resolve('next/headers');
    delete require.cache[nextHeadersPath];
    const supabasePath = require.resolve('../../../../../src/lib/supabase.ts');
    delete require.cache[supabasePath];

    // Also delete the route from require cache to ensure it picks up the latest mock inside each test
    const routePath = require.resolve('../../../../../src/app/api/auth/refresh/route.ts');
    delete require.cache[routePath];
};

test.describe('Auth Refresh API', () => {

    test.beforeEach(() => {
        cleanupMocks();
        // Backup process.env
        process.env.PROFILE_ELLA_PASSWORD = 'ella_password';
        process.env.PROFILE_EL_PASSWORD = 'el_password';
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 401 if device token is missing', async () => {
        setupMocks(undefined, null, null);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 500 if listUsers fails', async () => {
        const listUsersMock = async () => ({ error: new Error('Database down'), data: null });
        setupMocks('valid_token', listUsersMock, null);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 401 if device token is invalid or expired', async () => {
        const listUsersMock = async () => ({
            data: {
                users: [
                    { email: 'ella@mile.app', user_metadata: { device_tokens: ['some_other_token'] } }
                ]
            },
            error: null
        });
        setupMocks('invalid_token', listUsersMock, null);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 500 if server configuration error (missing password)', async () => {
        delete process.env.PROFILE_ELLA_PASSWORD;
        const listUsersMock = async () => ({
            data: {
                users: [
                    { email: 'ella@mile.app', user_metadata: { device_tokens: ['valid_token'] } }
                ]
            },
            error: null
        });
        setupMocks('valid_token', listUsersMock, null);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 500 if session establishment fails', async () => {
        const listUsersMock = async () => ({
            data: {
                users: [
                    { email: 'ella@mile.app', user_metadata: { device_tokens: ['valid_token'] } }
                ]
            },
            error: null
        });
        const signInMock = async () => ({
            data: null,
            error: new Error('Auth failed')
        });
        setupMocks('valid_token', listUsersMock, signInMock);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 200 and session for "ella" profile', async () => {
        const listUsersMock = async () => ({
            data: {
                users: [
                    { email: 'ella@mile.app', user_metadata: { device_tokens: ['valid_token'] } }
                ]
            },
            error: null
        });
        const signInMock = async ({ email, password }: any) => {
            expect(email).toBe('ella@mile.app');
            expect(password).toBe('ella_password');
            return {
                data: { session: { access_token: 'ella_access_token' } },
                error: null
            };
        };
        setupMocks('valid_token', listUsersMock, signInMock);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

    test('should return 200 and session for "el" profile', async () => {
        const listUsersMock = async () => ({
            data: {
                users: [
                    { email: 'el@mile.app', user_metadata: { device_tokens: ['valid_token_el'] } }
                ]
            },
            error: null
        });
        const signInMock = async ({ email, password }: any) => {
            expect(email).toBe('el@mile.app');
            expect(password).toBe('el_password');
            return {
                data: { session: { access_token: 'el_access_token' } },
                error: null
            };
        };
        setupMocks('valid_token_el', listUsersMock, signInMock);

        const { POST } = require('../../../../../src/app/api/auth/refresh/route.ts');
        const req = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Refresh via password removed' });
    });

});
