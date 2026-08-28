import crypto from 'crypto';

let originalRandomBytes: any;

import { test, expect } from '@playwright/test';

// We need to mock next/headers, supabase-server, and crypto

const setupMocks = (
    supabaseSignInMock: any,
    supabaseInsertMock: any,
    supabaseSelectMock: any,
    supabaseDeleteMock: any,
    cookieSetMock: any
) => {
    // 1. Mock next/headers
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            cookies: () => ({
                set: cookieSetMock
            })
        }
    } as any;

    // 2. Mock supabase client
    const supabasePath = require.resolve('../../../../src/lib/supabase-server.ts');

    // Create a mock chain for supabase builder
    const mockFrom = (table: string) => {
        if (table === 'device_tokens') {
            return {
                insert: supabaseInsertMock,
                select: () => ({
                    eq: () => ({
                        order: supabaseSelectMock
                    })
                }),
                delete: () => ({
                    in: supabaseDeleteMock
                })
            };
        }
        return {};
    };

    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: {
            createServerClient: () => ({
                auth: {
                    signInWithPassword: supabaseSignInMock
                },
                from: mockFrom
            })
        }
    } as any;


};

const cleanupMocks = () => {
    const nextHeadersPath = require.resolve('next/headers');
    delete require.cache[nextHeadersPath];
    const supabasePath = require.resolve('../../../../src/lib/supabase-server.ts');
    delete require.cache[supabasePath];


    // Also delete the route from require cache to ensure it picks up the latest mock inside each test
    const routePath = require.resolve('../../../../src/app/api/login/route.ts');
    delete require.cache[routePath];
};

test.describe('Login API', () => {

test.beforeEach(() => {
        originalRandomBytes = crypto.randomBytes;
        (crypto as any).randomBytes = (size: number) => ({
            toString: (format: string) => {
                if (format === 'hex') return 'mocked_device_token';
                return originalRandomBytes(size).toString(format);
            }
        });
        cleanupMocks();
        const originalEnv = process.env.ALLOWED_EMAILS;
        process.env.ALLOWED_EMAILS = 'el@mile.app,ella@mile.app';
        (test.info() as any).originalEnv = originalEnv;
    });

    test.afterEach(() => {
        (crypto as any).randomBytes = originalRandomBytes;
        cleanupMocks();
        if ((test.info() as any).originalEnv !== undefined) {
            process.env.ALLOWED_EMAILS = (test.info() as any).originalEnv;
        } else {
            delete process.env.ALLOWED_EMAILS;
        }
    });

    test('should return 400 if profile or password is missing', async () => {
        setupMocks(null, null, null, null, null);

        const { POST } = require('../../../../src/app/api/login/route.ts');
        const req = new Request('http://localhost:3000/api/login', {
            method: 'POST',
            body: JSON.stringify({ profile: 'ella' })
        });
        const res = await POST(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Missing profile or password' });
    });

    test('should return 401 if signInWithPassword fails', async () => {
        const signInMock = async () => ({
            data: null,
            error: new Error('Auth failed')
        });
        setupMocks(signInMock, null, null, null, null);

        const { POST } = require('../../../../src/app/api/login/route.ts');
        const req = new Request('http://localhost:3000/api/login', {
            method: 'POST',
            body: JSON.stringify({ profile: 'ella', password: 'wrong' })
        });
        const res = await POST(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid credentials or failed to establish session' });
    });

    test('should return 500 if token insertion fails', async () => {
        const signInMock = async () => ({
            data: { user: { id: 'user_123' }, session: { access_token: 'mock_token' } },
            error: null
        });
        const insertMock = async () => ({ error: new Error('DB Error') });
        setupMocks(signInMock, insertMock, null, null, null);

        const { POST } = require('../../../../src/app/api/login/route.ts');
        const req = new Request('http://localhost:3000/api/login', {
            method: 'POST',
            body: JSON.stringify({ profile: 'ella', password: 'correct' })
        });
        const res = await POST(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Failed to securely complete login process' });
    });

    test('should successfully login, set cookie, and cleanup old tokens', async () => {
        let cookieSetParams: any = null;

        const signInMock = async ({email, password}: any) => {
            expect(email).toBe('ella@mile.app');
            expect(password).toBe('correct');
            return {
                data: { user: { id: 'user_123' }, session: { access_token: 'mock_token' } },
                error: null
            };
        };
        const insertMock = async (data: any) => {
            expect(data).toEqual({ user_id: 'user_123', token: 'mocked_device_token' });
            return { error: null };
        };
        const selectMock = async () => ({
            data: [
                { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }
            ],
            error: null
        });
        const deleteMock = async (_column: string, ids: string[]) => {
            expect(ids).toEqual(['6']);
            return { error: null };
        };
        const cookieSetMock = (name: string, value: string, options: any) => {
            cookieSetParams = { name, value, options };
        };

        setupMocks(signInMock, insertMock, selectMock, deleteMock, cookieSetMock);

        const { POST } = require('../../../../src/app/api/login/route.ts');
        const req = new Request('http://localhost:3000/api/login', {
            method: 'POST',
            body: JSON.stringify({ profile: 'ella', password: 'correct' })
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, session: { access_token: 'mock_token' } });

        expect(cookieSetParams).not.toBeNull();
        expect(cookieSetParams.name).toBe('mile_device_token');
        expect(cookieSetParams.value).toBe('mocked_device_token');
        expect(cookieSetParams.options.httpOnly).toBe(true);
    });
});
